# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# VitalCare Professional

## AI-Assisted Smart Elder Care Management System

VitalCare Professional is an AI-powered elder care management platform designed to help caregivers and families monitor elderly people, manage healthcare activities, and detect emergencies in real time.

---

# 🚀 Project Overview

VitalCare Professional provides a centralized platform for:

* Elder health monitoring
* Medication management
* Doctor appointment management
* Emergency alerts
* AI-powered fall detection
* Camera-based activity monitoring
* Inactivity monitoring
* Caregiver management
* AI-generated health insights

The system combines a React frontend, FastAPI backend, Supabase database, MediaPipe pose detection, and a TensorFlow fall detection model.

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React
* Supabase JavaScript Client

## Backend

* Python
* FastAPI
* Uvicorn
* TensorFlow
* NumPy
* MediaPipe
* Python-dotenv
* Supabase Python Client

## Database & Authentication

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security (RLS)

## AI / Machine Learning

* TensorFlow / Keras
* MediaPipe Pose
* BiLSTM
* Fall / Non-Fall classification

---

# 📁 Project Structure

```text
vitalcare-professional/
│
├── backend/
│   ├── fall_prediction_service.py
│   ├── pose_service.py
│   ├── models/
│   │   └── vitalcare_fall_v2_best.keras
│   ├── pose_landmarker_lite.task
│   ├── .env
│   ├── venv312/
│   └── mediapipe-env/
│
├── public/
│
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── cameras/
│   │   ├── health/
│   │   ├── medications/
│   │   ├── appointments/
│   │   ├── alerts/
│   │   └── settings/
│   │
│   ├── services/
│   └── data/
│
├── .env
├── package.json
├── vite.config.js
└── README.md
```

---

# 🔐 Environment Variables

## Frontend

Create or update:

```text
.env
```

with:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_AI_API_URL=http://127.0.0.1:8001/predict
VITE_AI_HEALTH_URL=http://127.0.0.1:8001/health
```

Do not upload your real `.env` file to GitHub.

---

# 🔑 Backend Environment Variables

Inside:

```text
backend/.env
```

use:

```env
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
VITALCARE_ALERT_USER_ID=YOUR_USER_UUID
```

The Supabase service-role key must remain private.

---

# 🗄️ Supabase Database

The project currently uses these tables:

```text
profiles
health_records
medications
appointments
alerts
```

## profiles

Stores user profile information and roles.

Roles:

```text
admin
caregiver
user
```

## health_records

Stores health measurements such as:

```text
Heart Rate
Blood Pressure
SpO2
Hydration
Sleep
Weight
```

## medications

Stores medication information including:

```text
Name
Dosage
Frequency
Timing
Active status
```

## appointments

Stores:

```text
Doctor name
Specialization
Date
Time
Location
Appointment type
Reason
Status
```

## alerts

Stores emergency and system alerts.

Alert types:

```text
Emergency
Health
Medication
Appointment
System
```

Severity levels:

```text
Low
Medium
High
Critical
```

---

# ▶️ How to Start the Project

## Step 1 — Open the project

```bash
cd /Users/harshitkaur/Desktop/vitalcare-professional
```

---

# 🎨 Start Frontend

Install dependencies if required:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

If port 5173 is already being used, Vite may automatically use:

```text
http://localhost:5174
```

---

# 🤖 Start AI Backend

Open another terminal.

Go to backend:

```bash
cd /Users/harshitkaur/Desktop/vitalcare-professional/backend
```

Activate the TensorFlow environment:

```bash
source venv312/bin/activate
```

Start the FastAPI fall detection service:

```bash
uvicorn fall_prediction_service:app --host 127.0.0.1 --port 8001 --reload
```

Backend URL:

```text
http://127.0.0.1:8001
```

Health check:

```text
http://127.0.0.1:8001/health
```

---

# 📷 Camera + AI Fall Detection

The camera monitoring system works as follows:

```text
Web Camera
     ↓
MediaPipe Pose Detection
     ↓
33 Body Landmarks
     ↓
33 × 4 Features
     ↓
132 Features / Frame
     ↓
30 Frame Sequence
     ↓
TensorFlow BiLSTM Model
     ↓
Fall Probability
     ↓
65% Threshold
     ↓
3 Consecutive High-Probability Windows
     ↓
Fall Confirmed
     ↓
Supabase Critical Alert
     ↓
VitalCare Alerts Page
```

---

# 🧠 Fall Detection Model

Model:

```text
vitalcare_fall_v2_best.keras
```

Input shape:

```text
30 × 132
```

Output:

```text
Fall probability
```

Current threshold:

```text
65%
```

A fall is confirmed only when:

```text
3 consecutive windows >= 65%
```

This helps reduce false positives caused by a single uncertain prediction.

---

# 📊 Example AI Output

Example:

```text
Fall Probability: 77.47%
Prediction: FALL
Confirmed: NO
High Probability Windows: 1/3
Pose Frames: 266
Sequence: 30/30
```

This means the model currently considers the window likely to be a fall, but the system has not confirmed the fall yet.

Confirmation requires:

```text
1/3 → 2/3 → 3/3
```

Then:

```text
🚨 FALL CONFIRMED
```

and a Critical alert is inserted into Supabase.

---

# 🚨 Alert Flow

When a fall is confirmed:

```text
AI Model
   ↓
Fall Confirmed
   ↓
FastAPI
   ↓
Supabase alerts table
   ↓
Critical Alert
   ↓
Frontend Alerts Page
```

The alert contains:

```text
Title:
Fall Detected

Type:
Emergency

Severity:
Critical

Status:
Unread
```

---

# 💤 Inactivity Monitoring

The camera page also includes inactivity monitoring.

The system tracks activity and displays:

```text
Normal
```

when normal activity is detected.

This can later be extended to generate an alert if an elderly person remains inactive for a configured period.

---

# 🔑 Authentication

VitalCare uses Supabase Authentication.

Supported functionality includes:

```text
Sign Up
Login
Logout
User Profile
Role-based access
```

Roles:

```text
Admin
Caregiver
User
```

---

# 🌐 Application Routes

Current frontend routes:

```text
/
```

Landing page.

```text
/login
```

Login page.

```text
/signup
```

Signup page.

```text
/dashboard
```

Main dashboard.

```text
/cameras
```

Camera monitoring and AI fall detection.

```text
/health
```

Health records and monitoring.

```text
/medications
```

Medication management.

```text
/appointments
```

Doctor appointment management.

```text
/alerts
```

Emergency and system alerts.

```text
/settings
```

User settings.

---

# 🧪 Testing AI Fall Detection

1. Start the backend.

```bash
uvicorn fall_prediction_service:app --host 127.0.0.1 --port 8001 --reload
```

2. Start the frontend.

```bash
npm run dev
```

3. Open:

```text
http://localhost:5173
```

or the port shown by Vite.

4. Login.

5. Open:

```text
Cameras
```

6. Allow camera access.

7. Click:

```text
Start Camera
```

8. Check:

```text
AI Status
Fall Probability
Prediction
Confirmed
High Probability Windows
Pose Frames
Sequence
```

---

# 🛑 Stop the Project

To stop the frontend:

```text
Ctrl + C
```

To stop the backend:

```text
Ctrl + C
```

---

# 🔄 Starting the Project After Some Time

Whenever you reopen the project, follow these steps.

### Terminal 1 — Frontend

```bash
cd /Users/harshitkaur/Desktop/vitalcare-professional
npm run dev
```

### Terminal 2 — Backend

```bash
cd /Users/harshitkaur/Desktop/vitalcare-professional/backend
source venv312/bin/activate
uvicorn fall_prediction_service:app --host 127.0.0.1 --port 8001 --reload
```

Then open the frontend URL shown by Vite.

---

# ⚠️ Important Notes

## Do not delete

```text
backend/models/vitalcare_fall_v2_best.keras
```

This is the trained fall detection model.

Do not delete:

```text
backend/pose_landmarker_lite.task
```

This is required for pose detection.

Do not commit:

```text
.env
backend/.env
```

because they contain private credentials.

---

# 🐍 Python Environments

The project uses separate Python environments because TensorFlow and MediaPipe have dependency compatibility issues.

TensorFlow environment:

```text
backend/venv312
```

Activate it with:

```bash
source venv312/bin/activate
```

MediaPipe environment:

```text
backend/mediapipe-env
```

Activate it with:

```bash
source mediapipe-env/bin/activate
```

The FastAPI fall prediction service uses:

```text
venv312
```

---

# 🩺 Health Check

To check whether the AI backend is working, open:

```text
http://127.0.0.1:8001/health
```

Expected response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "fall_threshold": 0.65,
  "required_consecutive_windows": 3,
  "supabase_configured": true
}
```

---

# 🐛 Common Problems

## Backend does not start

Make sure you are inside:

```text
backend/
```

and the environment is activated:

```bash
source venv312/bin/activate
```

Then:

```bash
uvicorn fall_prediction_service:app --host 127.0.0.1 --port 8001 --reload
```

---

## Frontend cannot connect to AI

Check that the backend is running:

```text
http://127.0.0.1:8001/health
```

Also check the frontend `.env`:

```env
VITE_AI_API_URL=http://127.0.0.1:8001/predict
VITE_AI_HEALTH_URL=http://127.0.0.1:8001/health
```

Restart Vite after changing `.env`.

---

## Camera does not work

Check browser camera permissions.

Make sure the application is opened from:

```text
localhost
```

and click:

```text
Allow Camera
```

---

## AI shows WAITING

Check:

```text
AI Connected
Pose Frames
Sequence
```

The sequence needs:

```text
30/30
```

before a prediction can be sent.

---

# 📌 Current Project Status

```text
✅ React Frontend
✅ Vite
✅ Tailwind CSS
✅ Supabase Authentication
✅ User Profiles
✅ Health Records
✅ Medication Management
✅ Appointment Management
✅ Alerts
✅ Camera Monitoring
✅ MediaPipe Pose Detection
✅ TensorFlow Fall Detection
✅ FastAPI AI Backend
✅ Supabase Fall Alerts
✅ Critical Fall Alert Display
✅ Inactivity Monitoring
```

---

# 🚀 Future Scope

Possible future improvements:

* Multiple IP/CCTV camera support
* Smartwatch integration
* Real-time SpO2 and heart-rate monitoring
* AI health recommendations
* Automatic medication reminders
* Voice assistance for elderly users
* Video calling with caregivers
* Advanced activity recognition
* Improved fall detection accuracy
* Cloud deployment
* Docker deployment
* AWS deployment
* Real-time notifications
* Mobile application

---

# 👩‍💻 Development

Project:

**VitalCare Professional**

Description:

**AI-Assisted Smart Elder Care Management System**

Main focus:

```text
Elder Safety
Healthcare Monitoring
AI Assistance
Emergency Detection
Caregiver Support
```

---

# ❤️ Final Note

When starting the project after a break, remember:

```text
1. Start Frontend
2. Start FastAPI Backend
3. Open VitalCare
4. Login
5. Open Cameras
6. Start Camera
7. Check AI Monitoring
```

Keep the backend terminal running while using AI camera detection.
