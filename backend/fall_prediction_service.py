import os

import numpy as np
import tensorflow as tf
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)
VITALCARE_ALERT_USER_ID = os.getenv(
    "VITALCARE_ALERT_USER_ID"
)

if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing from backend/.env"
    )

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env"
    )

if not VITALCARE_ALERT_USER_ID:
    raise RuntimeError(
        "VITALCARE_ALERT_USER_ID is missing from backend/.env"
    )

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "models",
    "vitalcare_fall_v2_best.keras",
)

SEQUENCE_LENGTH = 30
FEATURE_COUNT = 132
FALL_THRESHOLD = 0.65
CONSECUTIVE_WINDOWS_REQUIRED = 3

app = FastAPI(
    title="VitalCare Fall Prediction Service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://vitalcare-professional.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading VitalCare fall detection model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("TensorFlow:", tf.__version__)
print(
    "Model:",
    model.input_shape,
    "->",
    model.output_shape,
)
print("Supabase connection configured.")
print("Fall prediction service ready.")

high_probability_count = 0


class PredictionRequest(BaseModel):
    landmarks: list[list[float]]


@app.get("/")
def root():
    return {
        "service": "VitalCare Fall Prediction Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "fall_threshold": FALL_THRESHOLD,
        "required_consecutive_windows": CONSECUTIVE_WINDOWS_REQUIRED,
        "supabase_configured": True,
    }


def create_fall_alert():
    try:
        alert_data = {
            "user_id": VITALCARE_ALERT_USER_ID,
            "title": "Fall Detected",
            "message": (
                "VitalCare AI has detected and confirmed "
                "a possible fall through camera monitoring."
            ),
            "alert_type": "Emergency",
            "severity": "Critical",
            "status": "Unread",
        }

        supabase.table("alerts").insert(
            alert_data
        ).execute()

        print("🚨 FALL ALERT CREATED")

        return True

    except Exception as error:
        print("ERROR CREATING FALL ALERT:")
        print(error)

        return False


@app.post("/predict")
def predict(request: PredictionRequest):
    global high_probability_count

    landmarks = np.array(
        request.landmarks,
        dtype=np.float32,
    )

    expected_shape = (
        SEQUENCE_LENGTH,
        FEATURE_COUNT,
    )

    if landmarks.shape != expected_shape:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Expected landmark shape {expected_shape}, "
                f"but received {landmarks.shape}"
            ),
        )

    model_input = np.expand_dims(
        landmarks,
        axis=0,
    )

    probability = float(
        model.predict(
            model_input,
            verbose=0,
        )[0][0]
    )

    if probability >= FALL_THRESHOLD:
        high_probability_count += 1
    else:
        high_probability_count = 0

    fall_confirmed = (
        high_probability_count
        >= CONSECUTIVE_WINDOWS_REQUIRED
    )

    if probability >= FALL_THRESHOLD:
        prediction = "FALL"
    else:
        prediction = "NO_FALL"

    alert_created = False

    if fall_confirmed:
        alert_created = create_fall_alert()
        high_probability_count = 0

    return {
        "fall_probability": round(
            probability,
            4,
        ),
        "fall_percentage": round(
            probability * 100,
            2,
        ),
        "prediction": prediction,
        "threshold": FALL_THRESHOLD,
        "consecutive_high_windows": high_probability_count,
        "required_consecutive_windows": CONSECUTIVE_WINDOWS_REQUIRED,
        "fall_confirmed": fall_confirmed,
        "supabase_alert_created": alert_created,
    }
