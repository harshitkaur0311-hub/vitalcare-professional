import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  HeartPulse,
  UserRound,
} from "lucide-react";
import { supabase } from "../../services/supabase";

function SignUp() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("caregiver");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSignUp = async (event) => {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: selectedRole,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      localStorage.setItem("vitalcareRole", selectedRole);

      if (data.session) {
        navigate("/dashboard");
      } else {
        setError(
          "Account created successfully. Please check your email to confirm your account."
        );
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <h2 className="text-2xl font-bold text-slate-900">
            Create Account
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Create your VitalCare account to get started.
          </p>

          {/* Role Selection */}
          <div className="mt-7">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Select your role
            </label>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
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

          {/* Sign Up Form */}
          <form
            onSubmit={handleSignUp}
            className="mt-7 space-y-5"
          >

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setError("");
                }}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                placeholder="Create a password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-xs text-slate-500 mt-1">
                Password must contain at least 6 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                required
                minLength={6}
                className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${
                  confirmPassword &&
                  password !== confirmPassword
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
              />
            </div>

            {/* Error / Success Message */}
            {error && (
              <div
                className={`text-sm rounded-lg px-4 py-3 ${
                  error.includes("successfully")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {error}
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}

            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign in
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

export default SignUp;