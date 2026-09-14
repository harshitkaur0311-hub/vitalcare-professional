import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  HeartPulse,
  UserRound,
} from "lucide-react";
import { supabase } from "../../services/supabase";

function Login() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("caregiver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: "admin",
      title: "Admin",
      description: "Manage the complete system",
      icon: ShieldCheck,
    },
    {
      id: "caregiver",
      title: "Caregiver",
      description: "Monitor and manage elder care",
      icon: HeartPulse,
    },
    {
      id: "user",
      title: "User / Elder",
      description: "View your health and care",
      icon: UserRound,
    },
  ];

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setError("Unable to sign in. Please try again.");
        return;
      }

      // Save the selected role for the current frontend
      localStorage.setItem("vitalcareRole", selectedRole);

      // Go to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setLoading(true);

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim()
        );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setError(
        "Password reset link has been sent to your email."
      );
    } catch (err) {
      console.error(err);
      setError("Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-3xl font-bold text-blue-700"
          >
            VitalCare
          </Link>

          <p className="text-slate-500 mt-2">
            Professional Elder Care
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome Back
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Sign in to continue to your dashboard.
          </p>

          {/* Role Selection */}
          <div className="mt-7">

            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Select your role
            </label>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected =
                  selectedRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id);
                      setError("");
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">

                      {/* Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? "bg-blue-600"
                            : "bg-slate-100"
                        }`}
                      >
                        <Icon
                          size={22}
                          className={
                            isSelected
                              ? "text-white"
                              : "text-slate-600"
                          }
                        />
                      </div>

                      {/* Role Information */}
                      <div className="flex-1">

                        <p className="font-semibold text-slate-900">
                          {role.title}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {role.description}
                        </p>

                      </div>

                      {/* Radio Circle */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>

                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="mt-7 space-y-5"
          >

            {/* Email */}
            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Password */}
            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Remember Me / Forgot Password */}
            <div className="flex justify-between items-center text-sm">

              <label className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  className="rounded"
                />

                <span className="text-slate-600">
                  Remember me
                </span>

              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-blue-600 hover:underline"
              >
                Forgot password?
              </button>

            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`text-sm rounded-lg px-4 py-3 ${
                  error.includes("sent to your email")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {error}
              </div>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading
                ? "Signing In..."
                : `Sign In as ${
                    roles.find(
                      (role) =>
                        role.id === selectedRole
                    )?.title
                  }`}
            </button>

          </form>

          {/* Sign Up */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}

            <Link
              to="/signup"
              className="text-blue-600 font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>

        </div>

        {/* Back to Home */}
        <Link
          to="/"
          className="block text-center text-sm text-slate-500 mt-6 hover:text-blue-600"
        >
          ← Back to Home
        </Link>

      </div>
    </div>
  );
}

export default Login;