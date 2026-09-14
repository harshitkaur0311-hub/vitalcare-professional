import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/landing";
import Login from "./pages/auth/login";
import SignUp from "./pages/auth/signup";

import Dashboard from "./pages/dashboard/dashboard";
import CameraMonitoring from "./pages/cameras/Cameramonitoring";
import HealthMonitoring from "./pages/health/healthmonitoring";
import Medications from "./pages/medications/medications";
import Appointments from "./pages/appointments/appointments";
import Alerts from "./pages/alerts/alerts";
import Settings from "./pages/settings/settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cameras" element={<CameraMonitoring />} />
      <Route path="/health" element={<HealthMonitoring />} />
      <Route path="/medications" element={<Medications />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
