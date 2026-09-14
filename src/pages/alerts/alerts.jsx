import React, { useEffect, useState } from "react";
import {
  Plus,
  Bell,
  AlertTriangle,
  HeartPulse,
  Pill,
  CalendarDays,
  Settings,
  CheckCircle,
  Circle,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    alert_type: "Health",
    severity: "Medium",
  });

  // --------------------------------------------------
  // LOAD ALERTS
  // --------------------------------------------------
  const loadAlerts = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        return;
      }

      if (!user) {
        console.error("No logged-in user.");
        return;
      }

      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error loading alerts:", error);
        return;
      }

      setAlerts(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------
  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      alert_type: "Health",
      severity: "Medium",
    });
  };

  // --------------------------------------------------
  // ADD ALERT
  // --------------------------------------------------
  const addAlert = async () => {
    if (!form.title.trim()) {
      alert("Please enter the alert title.");
      return;
    }

    if (!form.message.trim()) {
      alert("Please enter the alert message.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        alert("Unable to identify the logged-in user.");
        return;
      }

      if (!user) {
        alert("Please login again.");
        return;
      }

      const alertData = {
        user_id: user.id,
        title: form.title.trim(),
        message: form.message.trim(),
        alert_type: form.alert_type,
        severity: form.severity,
        status: "Unread",
      };

      console.log("Saving alert:", alertData);

      const { error } = await supabase
        .from("alerts")
        .insert([alertData]);

      if (error) {
        console.error("Error adding alert:", error);
        alert(error.message);
        return;
      }

      alert("Alert created successfully!");

      resetForm();
      setShowModal(false);

      await loadAlerts();
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Something went wrong while creating the alert.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // MARK AS READ
  // --------------------------------------------------
  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "Read",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error marking alert as read:", error);
        alert(error.message);
        return;
      }

      await loadAlerts();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // RESOLVE ALERT
  // --------------------------------------------------
  const resolveAlert = async (id) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "Resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error resolving alert:", error);
        alert(error.message);
        return;
      }

      await loadAlerts();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // DELETE ALERT
  // --------------------------------------------------
  const deleteAlert = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this alert?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting alert:", error);
        alert(error.message);
        return;
      }

      await loadAlerts();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // ALERT ICON
  // --------------------------------------------------
  const getAlertIcon = (type) => {
    switch (type) {
      case "Emergency":
        return (
          <ShieldAlert
            size={24}
            className="text-red-600"
          />
        );

      case "Health":
        return (
          <HeartPulse
            size={24}
            className="text-blue-600"
          />
        );

      case "Medication":
        return (
          <Pill
            size={24}
            className="text-purple-600"
          />
        );

      case "Appointment":
        return (
          <CalendarDays
            size={24}
            className="text-green-600"
          />
        );

      case "System":
        return (
          <Settings
            size={24}
            className="text-slate-600"
          />
        );

      default:
        return (
          <Bell
            size={24}
            className="text-blue-600"
          />
        );
    }
  };

  // --------------------------------------------------
  // ALERT ICON BACKGROUND
  // --------------------------------------------------
  const getAlertIconBackground = (type) => {
    switch (type) {
      case "Emergency":
        return "bg-red-100";

      case "Health":
        return "bg-blue-100";

      case "Medication":
        return "bg-purple-100";

      case "Appointment":
        return "bg-green-100";

      case "System":
        return "bg-slate-100";

      default:
        return "bg-blue-100";
    }
  };

  // --------------------------------------------------
  // SEVERITY STYLE
  // --------------------------------------------------
  const getSeverityClass = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700";

      case "High":
        return "bg-orange-100 text-orange-700";

      case "Medium":
        return "bg-yellow-100 text-yellow-700";

      case "Low":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // --------------------------------------------------
  // STATUS STYLE
  // --------------------------------------------------
  const getStatusClass = (status) => {
    switch (status) {
      case "Unread":
        return "bg-blue-100 text-blue-700";

      case "Read":
        return "bg-slate-100 text-slate-700";

      case "Resolved":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------
  const formatTime = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------
  const unreadCount = alerts.filter(
    (alert) => alert.status === "Unread"
  ).length;

  const criticalCount = alerts.filter(
    (alert) =>
      alert.severity === "Critical" &&
      alert.status !== "Resolved"
  ).length;

  const resolvedCount = alerts.filter(
    (alert) => alert.status === "Resolved"
  ).length;

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-600">
            Loading alerts...
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
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Bell
                className="text-red-600"
                size={26}
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Alerts & Notifications
              </h1>

              <p className="text-slate-500 mt-1">
                Monitor important health and safety notifications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            <Plus size={20} />
            Create Alert
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {/* UNREAD */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Unread Alerts
                </p>

                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {unreadCount}
                </p>
              </div>

              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell
                  className="text-blue-600"
                  size={24}
                />
              </div>
            </div>
          </div>

          {/* CRITICAL */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Critical Alerts
                </p>

                <p className="text-3xl font-bold text-red-600 mt-2">
                  {criticalCount}
                </p>
              </div>

              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle
                  className="text-red-600"
                  size={24}
                />
              </div>
            </div>
          </div>

          {/* RESOLVED */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Resolved
                </p>

                <p className="text-3xl font-bold text-green-600 mt-2">
                  {resolvedCount}
                </p>
              </div>

              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle
                  className="text-green-600"
                  size={24}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ALERT LIST */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Alert History
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Review and manage your notifications
            </p>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-16">

              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell
                  className="text-blue-600"
                  size={30}
                />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No alerts yet
              </h3>

              <p className="text-slate-500 mt-2 mb-5">
                Your important notifications will appear here.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowModal(true)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Create Alert
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {alerts.map((alert) => {

                const isUnread =
                  alert.status === "Unread";

                return (
                  <div
                    key={alert.id}
                    className={
                      "border rounded-xl p-5 transition " +
                      (isUnread
                        ? "border-blue-200 bg-blue-50/30"
                        : "border-slate-200 bg-white")
                    }
                  >

                    <div className="flex flex-col lg:flex-row gap-5">

                      {/* ICON */}
                      <div
                        className={
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 " +
                          getAlertIconBackground(
                            alert.alert_type
                          )
                        }
                      >
                        {getAlertIcon(
                          alert.alert_type
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-bold text-slate-900">
                            {alert.title}
                          </h3>

                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                          )}

                          <span
                            className={
                              "px-3 py-1 rounded-full text-xs font-semibold " +
                              getSeverityClass(
                                alert.severity
                              )
                            }
                          >
                            {alert.severity}
                          </span>

                          <span
                            className={
                              "px-3 py-1 rounded-full text-xs font-semibold " +
                              getStatusClass(
                                alert.status
                              )
                            }
                          >
                            {alert.status}
                          </span>
                        </div>

                        <p className="text-slate-600 mt-2 leading-relaxed">
                          {alert.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-400">

                          <span>
                            {alert.alert_type}
                          </span>

                          <span>
                            {formatDate(
                              alert.created_at
                            )}
                          </span>

                          <span>
                            {formatTime(
                              alert.created_at
                            )}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2 lg:self-center">

                        {alert.status ===
                          "Unread" && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(
                                alert.id
                              )
                            }
                            className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold"
                          >
                            Mark Read
                          </button>
                        )}

                        {alert.status !==
                          "Resolved" && (
                          <button
                            type="button"
                            onClick={() =>
                              resolveAlert(
                                alert.id
                              )
                            }
                            className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold"
                          >
                            Resolve
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            deleteAlert(alert.id)
                          }
                          className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center"
                          title="Delete alert"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE ALERT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Alert
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Add an important notification
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-5">

              {/* TITLE */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Alert Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Blood pressure needs attention"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* TYPE + SEVERITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Alert Type
                  </label>

                  <select
                    name="alert_type"
                    value={form.alert_type}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Emergency">
                      Emergency
                    </option>

                    <option value="Health">
                      Health
                    </option>

                    <option value="Medication">
                      Medication
                    </option>

                    <option value="Appointment">
                      Appointment
                    </option>

                    <option value="System">
                      System
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Severity
                  </label>

                  <select
                    name="severity"
                    value={form.severity}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>
                  </select>
                </div>
              </div>

              {/* MESSAGE */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Alert Message
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter the details of this alert..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* PREVIEW */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Alert Preview
                </p>

                <div className="flex items-start gap-3">

                  <div
                    className={
                      "w-10 h-10 rounded-lg flex items-center justify-center " +
                      getAlertIconBackground(
                        form.alert_type
                      )
                    }
                  >
                    {getAlertIcon(
                      form.alert_type
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {form.title ||
                        "Alert title"}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {form.message ||
                        "Alert message will appear here."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-slate-200">

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addAlert}
                disabled={saving}
                className="flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold"
              >
                {saving
                  ? "Creating..."
                  : "Create Alert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;