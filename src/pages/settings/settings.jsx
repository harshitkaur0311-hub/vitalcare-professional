import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Shield,
  Bell,
  Lock,
  Save,
  LogOut,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("vitalcareNotifications") !== "false"
  );

  const [emergencyAlerts, setEmergencyAlerts] = useState(
    () => localStorage.getItem("vitalcareEmergencyAlerts") !== "false"
  );

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // --------------------------------------------------
  // LOAD USER + PROFILE
  // --------------------------------------------------
  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        setErrorMessage("Unable to load your account.");
        return;
      }

      if (!currentUser) {
        setErrorMessage("Please login again.");
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("Profile error:", error);

        // Fallback to auth user information
        setEmail(currentUser.email || "");
        setFullName(
          currentUser.user_metadata?.full_name || ""
        );
        setRole(
          currentUser.user_metadata?.role || "caregiver"
        );

        return;
      }

      setProfile(data);

      setFullName(data.full_name || "");
      setEmail(data.email || currentUser.email || "");
      setRole(data.role || "caregiver");
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage("Something went wrong while loading settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // --------------------------------------------------
  // SAVE PROFILE
  // --------------------------------------------------
  const saveProfile = async () => {
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      setSuccessMessage("");
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      if (!user) {
        setErrorMessage("Please login again.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        setErrorMessage(error.message);
        return;
      }

      // Also update auth metadata
      const { error: authError } =
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
          },
        });

      if (authError) {
        console.error(
          "Auth metadata update error:",
          authError
        );
      }

      setSuccessMessage(
        "Profile updated successfully."
      );

      await loadProfile();
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage(
        "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // PASSWORD RESET
  // --------------------------------------------------
  const sendPasswordReset = async () => {
    if (!email) {
      setErrorMessage(
        "No email address is associated with this account."
      );
      setSuccessMessage("");
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email
        );

      if (error) {
        console.error(
          "Password reset error:",
          error
        );

        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage(
        "Password reset instructions have been sent to your email."
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage(
        "Unable to send password reset instructions."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // NOTIFICATION SETTINGS
  // --------------------------------------------------
  const handleNotifications = (value) => {
    setNotifications(value);

    localStorage.setItem(
      "vitalcareNotifications",
      String(value)
    );
  };

  // --------------------------------------------------
  // EMERGENCY ALERT SETTINGS
  // --------------------------------------------------
  const handleEmergencyAlerts = (value) => {
    setEmergencyAlerts(value);

    localStorage.setItem(
      "vitalcareEmergencyAlerts",
      String(value)
    );
  };

  // --------------------------------------------------
  // RESET PREFERENCES
  // --------------------------------------------------
  const resetPreferences = () => {
    const confirmed = window.confirm(
      "Reset notification preferences to default?"
    );

    if (!confirmed) {
      return;
    }

    setNotifications(true);
    setEmergencyAlerts(true);

    localStorage.setItem(
      "vitalcareNotifications",
      "true"
    );

    localStorage.setItem(
      "vitalcareEmergencyAlerts",
      "true"
    );

    setSuccessMessage(
      "Preferences restored to default."
    );

    setErrorMessage("");
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await supabase.auth.signOut();

      localStorage.removeItem("vitalcareRole");

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setErrorMessage("Unable to logout.");
    }
  };

  // --------------------------------------------------
  // ROLE DISPLAY
  // --------------------------------------------------
  const getRoleName = (value) => {
    if (!value) {
      return "Caregiver";
    }

    switch (value.toLowerCase()) {
      case "admin":
        return "Administrator";

      case "caregiver":
        return "Caregiver";

      case "user":
        return "Elder / User";

      default:
        return value;
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-600">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield
                className="text-blue-600"
                size={26}
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Settings
              </h1>

              <p className="text-slate-500 mt-1">
                Manage your VitalCare account and preferences
              </p>
            </div>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">

            <CheckCircle
              className="text-green-600 shrink-0"
              size={20}
            />

            <p className="text-green-700 text-sm font-medium">
              {successMessage}
            </p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">

            <AlertCircle
              className="text-red-600 shrink-0"
              size={20}
            />

            <p className="text-red-700 text-sm font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {/* PROFILE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User
                className="text-blue-600"
                size={21}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Profile Information
              </h2>

              <p className="text-sm text-slate-500">
                Update your personal information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* NAME */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-xl pl-11 pr-4 py-3 outline-none cursor-not-allowed"
                />
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Email address cannot be changed here.
              </p>
            </div>

            {/* ROLE */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Role
              </label>

              <div className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">

                <span className="text-slate-700 font-medium">
                  {getRoleName(role)}
                </span>

                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  {role || "caregiver"}
                </span>
              </div>
            </div>

            {/* ACCOUNT STATUS */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Status
              </label>

              <div className="border border-green-200 bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">

                <CheckCircle
                  size={18}
                  className="text-green-600"
                />

                <span className="text-green-700 font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="mt-6 flex justify-end">

            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>
          </div>
        </div>

        {/* NOTIFICATION SETTINGS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell
                className="text-purple-600"
                size={21}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Notifications
              </h2>

              <p className="text-sm text-slate-500">
                Control how VitalCare notifies you
              </p>
            </div>
          </div>

          {/* GENERAL NOTIFICATIONS */}
          <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100">

            <div>
              <h3 className="font-semibold text-slate-800">
                General Notifications
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Receive updates about your VitalCare activities.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleNotifications(
                  !notifications
                )
              }
              className={
                "relative w-12 h-7 rounded-full transition shrink-0 " +
                (notifications
                  ? "bg-blue-600"
                  : "bg-slate-300")
              }
            >
              <span
                className={
                  "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition " +
                  (notifications
                    ? "left-6"
                    : "left-1")
                }
              />
            </button>
          </div>

          {/* EMERGENCY ALERTS */}
          <div className="flex items-center justify-between gap-4 py-4">

            <div>
              <h3 className="font-semibold text-slate-800">
                Emergency Alerts
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Receive important emergency and safety notifications.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleEmergencyAlerts(
                  !emergencyAlerts
                )
              }
              className={
                "relative w-12 h-7 rounded-full transition shrink-0 " +
                (emergencyAlerts
                  ? "bg-red-600"
                  : "bg-slate-300")
              }
            >
              <span
                className={
                  "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition " +
                  (emergencyAlerts
                    ? "left-6"
                    : "left-1")
                }
              />
            </button>
          </div>

          {/* RESET */}
          <div className="pt-4 border-t border-slate-100">

            <button
              type="button"
              onClick={resetPreferences}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              <RotateCcw size={16} />
              Reset preferences
            </button>
          </div>
        </div>

        {/* SECURITY */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Lock
                className="text-orange-600"
                size={21}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Security
              </h2>

              <p className="text-sm text-slate-500">
                Manage your account security
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-slate-50 rounded-xl">

            <div>
              <h3 className="font-semibold text-slate-800">
                Password
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Send a password reset link to your registered email.
              </p>
            </div>

            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={saving}
              className="flex items-center justify-center gap-2 border border-slate-300 hover:bg-white text-slate-700 px-4 py-2.5 rounded-xl font-semibold transition"
            >
              <Lock size={17} />

              {saving
                ? "Sending..."
                : "Reset Password"}
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sign out
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Sign out of your VitalCare account on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center py-8">

          <p className="text-sm text-slate-400">
            VitalCare Professional
          </p>

          <p className="text-xs text-slate-400 mt-1">
            AI-Assisted Smart Elder Care Management System
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;