from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VitalCare AI Backend",
    description="AI-powered backend for VitalCare Professional",
    version="1.0.0",
)

# Allow the VitalCare frontend to communicate with the AI backend
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


@app.get("/")
def root():
    return {"message": "VitalCare AI Backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}