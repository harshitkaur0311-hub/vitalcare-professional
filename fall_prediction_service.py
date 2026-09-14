```python
import os
from collections import deque

import numpy as np
import tensorflow as tf
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
VITALCARE_ALERT_USER_ID = os.getenv("VITALCARE_ALERT_USER_ID")


# ============================================================
# MODEL SETTINGS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "vitalcare_fall_v2_best.keras",
)

SEQUENCE_LENGTH = 30
FEATURE_COUNT = 132

# Model probability threshold
FALL_THRESHOLD = 0.65

# Number of consecutive high-probability windows
REQUIRED_CONSECUTIVE_WINDOWS = 3


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="VitalCare Fall Detection AI",
    description="AI-powered fall detection service for VitalCare Professional",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GLOBAL VARIABLES
# ============================================================

model = None

supabase: Client | None = None

# Stores recent prediction results
prediction_history = deque(maxlen=10)

# Counts consecutive high-probability windows
consecutive_high_windows = 0


# ============================================================
# LOAD MODEL
# ============================================================

def load_fall_model():
    global model

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Fall detection model not found at: {MODEL_PATH}"
        )

    print("=" * 60)
    print("Loading VitalCare fall detection model...")
    print(f"Model path: {MODEL_PATH}")

    model = tf.keras.models.load_model(MODEL_PATH)

    print("Fall detection model loaded successfully.")
    print(f"Input shape: {model.input_shape}")
    print("=" * 60)


# ============================================================
# SUPABASE
# ============================================================

def initialize_supabase():
    global supabase

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("WARNING: Supabase environment variables are missing.")
        print("Fall detection will still work, but alerts cannot be created.")
        return

    try:
        supabase = create_client(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
        )

        print("Supabase connected successfully.")

    except Exception as error:
        print(f"WARNING: Could not initialize Supabase: {error}")
        supabase = None


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():
    load_fall_model()
    initialize_supabase()


# ============================================================
# REQUEST MODEL
# ============================================================

class PredictionRequest(BaseModel):
    landmarks: list


# ============================================================
# SUPABASE ALERT
# ============================================================

def create_fall_alert(fall_percentage: float):
    """
    Creates a Critical Fall Detected alert in Supabase.
    """

    if supabase is None:
        print("Supabase is not configured. Alert was not created.")
        return False

    if not VITALCARE_ALERT_USER_ID:
        print("VITALCARE_ALERT_USER_ID is missing. Alert was not created.")
        return False

    try:
        alert_data = {
            "user_id": VITALCARE_ALERT_USER_ID,
            "title": "Fall Detected",
            "message": (
                f"VitalCare AI detected a possible fall "
                f"with {fall_percentage:.2f}% probability."
            ),
            "alert_type": "Emergency",
            "severity": "Critical",
            "status": "Unread",
        }

        response = (
            supabase
            .table("alerts")
            .insert(alert_data)
            .execute()
        )

        print("=" * 60)
        print("🚨 FALL ALERT CREATED")
        print(f"Probability: {fall_percentage:.2f}%")
        print(f"Supabase response: {response.data}")
        print("=" * 60)

        return True

    except Exception as error:
        print("=" * 60)
        print("ERROR CREATING SUPABASE FALL ALERT")
        print(error)
        print("=" * 60)

        return False


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "message": "VitalCare Fall Detection AI is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "fall_threshold": FALL_THRESHOLD,
        "required_consecutive_windows": REQUIRED_CONSECUTIVE_WINDOWS,
        "supabase_configured": supabase is not None,
    }


# ============================================================
# FALL PREDICTION
# ============================================================

@app.post("/predict")
def predict_fall(request: PredictionRequest):
    global consecutive_high_windows

    # --------------------------------------------------------
    # Check model
    # --------------------------------------------------------

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Fall detection model is not loaded.",
        )

    # --------------------------------------------------------
    # Convert input
    # --------------------------------------------------------

    try:
        landmarks = np.array(
            request.landmarks,
            dtype=np.float32,
        )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid landmark data: {error}",
        )

    # --------------------------------------------------------
    # Validate shape
    # --------------------------------------------------------

    if landmarks.ndim != 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid landmark shape. "
                "Expected 2D data with shape (30, 132)."
            ),
        )

    if landmarks.shape != (
        SEQUENCE_LENGTH,
        FEATURE_COUNT,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid landmark shape: {landmarks.shape}. "
                f"Expected: "
                f"({SEQUENCE_LENGTH}, {FEATURE_COUNT})."
            ),
        )

    # --------------------------------------------------------
    # Prepare model input
    # --------------------------------------------------------

    model_input = np.expand_dims(
        landmarks,
        axis=0,
    )

    # Shape:
    # (1, 30, 132)

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    try:
        prediction = model.predict(
            model_input,
            verbose=0,
        )

        fall_probability = float(
            prediction[0][0]
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Model prediction failed: {error}",
        )

    # --------------------------------------------------------
    # Clamp probability
    # --------------------------------------------------------

    fall_probability = max(
        0.0,
        min(1.0, fall_probability),
    )

    fall_percentage = fall_probability * 100.0

    # --------------------------------------------------------
    # Determine current prediction
    # --------------------------------------------------------

    is_high_probability = (
        fall_probability >= FALL_THRESHOLD
    )

    if is_high_probability:
        consecutive_high_windows += 1
    else:
        consecutive_high_windows = 0

    # --------------------------------------------------------
    # FALL CONFIRMATION
    # --------------------------------------------------------

    fall_confirmed = (
        consecutive_high_windows
        >= REQUIRED_CONSECUTIVE_WINDOWS
    )

    prediction_label = (
        "FALL"
        if is_high_probability
        else "NON-FALL"
    )

    # --------------------------------------------------------
    # Store history
    # --------------------------------------------------------

    prediction_history.append(
        {
            "fall_probability": fall_probability,
            "fall_percentage": fall_percentage,
            "prediction": prediction_label,
            "high_probability": is_high_probability,
        }
    )

    # --------------------------------------------------------
    # Create alert only when fall becomes confirmed
    # --------------------------------------------------------

    alert_created = False

    if fall_confirmed:

        # Prevent creating the same alert repeatedly
        already_confirmed = False

        if len(prediction_history) >= REQUIRED_CONSECUTIVE_WINDOWS:

            recent_predictions = list(
                prediction_history
            )[-REQUIRED_CONSECUTIVE_WINDOWS:]

            already_confirmed = all(
                item["high_probability"]
                for item in recent_predictions
            )

        # Only create alert once for the current confirmation
        previous_count = consecutive_high_windows

        if previous_count == REQUIRED_CONSECUTIVE_WINDOWS:
            alert_created = create_fall_alert(
                fall_percentage
            )

        print("=" * 60)
        print("🚨 FALL CONFIRMED BY VITALCARE AI")
        print(f"Probability: {fall_percentage:.2f}%")
        print(
            f"Consecutive windows: "
            f"{consecutive_high_windows}/"
            f"{REQUIRED_CONSECUTIVE_WINDOWS}"
        )
        print(f"Alert created: {alert_created}")
        print("=" * 60)

    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

    return {
        "prediction": prediction_label,
        "fall_probability": fall_probability,
        "fall_percentage": round(
            fall_percentage,
            2,
        ),
        "fall_confirmed": fall_confirmed,
        "consecutive_high_windows": (
            consecutive_high_windows
        ),
        "required_consecutive_windows": (
            REQUIRED_CONSECUTIVE_WINDOWS
        ),
        "fall_threshold": FALL_THRESHOLD,
        "alert_created": alert_created,
    }


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "fall_prediction_service:app",
        host="127.0.0.1",
        port=8001,
        reload=False,
    )
```
