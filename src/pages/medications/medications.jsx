import React, { useEffect, useState } from "react";
import {
  Plus,
  Pill,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  Utensils,
  Sun,
  Moon,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    timing: "After Breakfast",
    schedule: "",
  });

  // --------------------------------------------------
  // LOAD MEDICATIONS
  // --------------------------------------------------
  const loadMedications = async () => {
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
        console.error("No logged-in user");
        return;
      }

      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading medications:", error);
        return;
      }

      setMedications(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // ADD MEDICATION
  // --------------------------------------------------
  const addMedication = async () => {
    if (!form.name.trim()) {
      alert("Please enter the medicine name.");
      return;
    }

    if (!form.dosage.trim()) {
      alert("Please enter the dosage.");
      return;
    }

    if (!form.frequency) {
      alert("Please select the frequency.");
      return;
    }

    if (!form.timing) {
      alert("Please select when to take the medicine.");
      return;
    }

    if (form.timing === "Specific Time" && !form.schedule) {
      alert("Please select the exact time.");
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

      const { error } = await supabase.from("medications").insert([
        {
          user_id: user.id,
          name: form.name.trim(),
          dosage: form.dosage.trim(),
          frequency: form.frequency,
          timing: form.timing,
          schedule: form.schedule || null,
          active: true,
        },
      ]);

      if (error) {
        console.error("Error adding medication:", error);
        alert(error.message);
        return;
      }

      setForm({
        name: "",
        dosage: "",
        frequency: "Once daily",
        timing: "After Breakfast",
        schedule: "",
      });

      setShowModal(false);

      await loadMedications();
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // TOGGLE MEDICATION
  // --------------------------------------------------
  const toggleMedication = async (medication) => {
    try {
      const { error } = await supabase
        .from("medications")
        .update({
          active: !medication.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", medication.id);

      if (error) {
        console.error("Error updating medication:", error);
        alert(error.message);
        return;
      }

      await loadMedications();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // DELETE MEDICATION
  // --------------------------------------------------
  const deleteMedication = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medication?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting medication:", error);
        alert(error.message);
        return;
      }

      await loadMedications();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // TIMING ICON
  // --------------------------------------------------
  const getTimingIcon = (timing) => {
    if (!timing) {
      return <Clock size={18} />;
    }

    if (timing.includes("Breakfast")) {
      return <Sun size={18} />;
    }

    if (timing.includes("Lunch")) {
      return <Utensils size={18} />;
    }

    if (timing.includes("Dinner") || timing.includes("Bedtime")) {
      return <Moon size={18} />;
    }

    return <Clock size={18} />;
  };

  // --------------------------------------------------
  // SAFE TIME FORMAT
  // --------------------------------------------------
  const formatTime = (time) => {
    if (
      !time ||
      typeof time !== "string" ||
      !time.includes(":")
    ) {
      return "";
    }

    const [hours, minutes] = time.split(":");

    const hourNumber = Number(hours);

    if (
      Number.isNaN(hourNumber) ||
      !minutes ||
      minutes.length < 2
    ) {
      return "";
    }

    const period = hourNumber >= 12 ? "PM" : "AM";

    let hour = hourNumber % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${String(hour).padStart(2, "0")}:${minutes} ${period}`;
  };

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------
  const activeCount = medications.filter(
    (medication) => medication.active
  ).length;

  const inactiveCount = medications.filter(
    (medication) => !medication.active
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
            Loading medications...
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
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Pill className="text-blue-600" size={26} />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Medications
                </h1>

                <p className="text-slate-500 mt-1">
                  Manage medicines and medication schedules
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            <Plus size={20} />
            Add Medication
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Medications
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {medications.length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Pill className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="text-3xl font-bold text-green-600 mt-2">
                  {activeCount}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle
                  className="text-green-600"
                  size={24}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Inactive
                </p>

                <p className="text-3xl font-bold text-slate-600 mt-2">
                  {inactiveCount}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <XCircle
                  className="text-slate-500"
                  size={24}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S SCHEDULE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock
                className="text-blue-600"
                size={20}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Today&apos;s Medication Schedule
              </h2>

              <p className="text-sm text-slate-500">
                Your current medication routine
              </p>
            </div>
          </div>

          {medications.filter(
            (medication) => medication.active
          ).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No active medications scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {medications
                .filter((medication) => medication.active)
                .map((medication) => {
                  const formattedTime = formatTime(
                    medication.schedule
                  );

                  return (
                    <div
                      key={medication.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          {getTimingIcon(medication.timing)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {medication.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {medication.dosage}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600 md:text-right">
                        <p className="font-medium">
                          {medication.frequency}
                        </p>

                        <p>
                          {medication.timing}

                          {formattedTime
                            ? ` • ${formattedTime}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ALL MEDICATIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              All Medications
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage your medication list
            </p>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pill
                  className="text-blue-600"
                  size={30}
                />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No medications added
              </h3>

              <p className="text-slate-500 mt-2 mb-5">
                Add your first medication to start managing
                your schedule.
              </p>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Add Medication
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((medication) => {
                const statusClass = medication.active
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600";

                const formattedTime = formatTime(
                  medication.schedule
                );

                return (
                  <div
                    key={medication.id}
                    className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* MEDICINE INFO */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                          <Pill
                            className="text-blue-600"
                            size={24}
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              {medication.name}
                            </h3>

                            <span
                              className={
                                "rounded-full px-3 py-1 text-xs font-semibold " +
                                statusClass
                              }
                            >
                              {medication.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <p className="text-slate-600 mt-1">
                            {medication.dosage}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={15} />
                              {medication.frequency}
                            </span>

                            <span className="flex items-center gap-1">
                              {getTimingIcon(medication.timing)}
                              {medication.timing}
                            </span>

                            {formattedTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={15} />
                                {formattedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleMedication(medication)
                          }
                          className={
                            medication.active
                              ? "px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                              : "px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-sm font-semibold transition"
                          }
                        >
                          {medication.active
                            ? "Mark Inactive"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteMedication(medication.id)
                          }
                          className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"
                          title="Delete medication"
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

      {/* ADD MEDICATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Medication
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Add medicine and schedule details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-5">

              {/* MEDICINE NAME */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Medicine Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Amlodipine"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* DOSAGE */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Dosage
                </label>

                <input
                  type="text"
                  name="dosage"
                  value={form.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 5 mg"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* FREQUENCY */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Frequency
                </label>

                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Every 4 hours</option>
                  <option>Every 6 hours</option>
                  <option>Every 8 hours</option>
                  <option>Every 12 hours</option>
                  <option>As needed</option>
                </select>
              </div>

              {/* TIMING */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  When to Take
                </label>

                <select
                  name="timing"
                  value={form.timing}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Before Breakfast</option>
                  <option>After Breakfast</option>
                  <option>Before Lunch</option>
                  <option>After Lunch</option>
                  <option>Before Dinner</option>
                  <option>After Dinner</option>
                  <option>At Bedtime</option>
                  <option>Specific Time</option>
                </select>
              </div>

              {/* EXACT TIME */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Exact Time
                  <span className="text-slate-400 font-normal ml-1">
                    {form.timing === "Specific Time"
                      ? ""
                      : "(Optional)"}
                  </span>
                </label>

                <input
                  type="time"
                  name="schedule"
                  value={form.schedule}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {form.timing === "Specific Time" && (
                  <p className="text-xs text-slate-500 mt-2">
                    Please select the exact time for this medication.
                  </p>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addMedication}
                disabled={saving}
                className="flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold transition"
              >
                {saving ? "Adding..." : "Add Medication"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Medications;