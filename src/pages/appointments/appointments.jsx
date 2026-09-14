import React, { useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  Trash2,
  X,
  Stethoscope,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { supabase } from "../../services/supabase";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    doctor_name: "",
    specialization: "",
    appointment_date: "",
    appointment_time: "",
    location: "",
    appointment_type: "In-person",
    reason: "",
  });

  // --------------------------------------------------
  // LOAD APPOINTMENTS
  // --------------------------------------------------
  const loadAppointments = async () => {
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
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) {
        console.error("Error loading appointments:", error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // --------------------------------------------------
  // GENERAL INPUT CHANGE
  // --------------------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // DATE CHANGE
  // --------------------------------------------------
  const handleDateChange = (event) => {
    const selectedDate = event.target.value;

    console.log("DATE SELECTED:", selectedDate);

    setForm((previous) => ({
      ...previous,
      appointment_date: selectedDate,
    }));
  };

  // --------------------------------------------------
  // TIME CHANGE
  // --------------------------------------------------
  const handleTimeChange = (event) => {
    const selectedTime = event.target.value;

    console.log("TIME SELECTED:", selectedTime);

    setForm((previous) => ({
      ...previous,
      appointment_time: selectedTime,
    }));
  };

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------
  const resetForm = () => {
    setForm({
      doctor_name: "",
      specialization: "",
      appointment_date: "",
      appointment_time: "",
      location: "",
      appointment_type: "In-person",
      reason: "",
    });
  };

  // --------------------------------------------------
  // ADD APPOINTMENT
  // --------------------------------------------------
  const addAppointment = async () => {
    console.log("=================================");
    console.log("APPOINTMENT FORM:");
    console.log(form);
    console.log("DATE:", form.appointment_date);
    console.log("TIME:", form.appointment_time);
    console.log("=================================");

    // Doctor validation
    if (!form.doctor_name.trim()) {
      alert("Please enter the doctor name.");
      return;
    }

    // Specialization validation
    if (!form.specialization.trim()) {
      alert("Please enter the specialization.");
      return;
    }

    // Date validation
    const selectedDate = String(
      form.appointment_date || ""
    ).trim();

    console.log("DATE BEFORE SAVING:", selectedDate);

    if (!selectedDate) {
      alert("Please select the appointment date.");
      return;
    }

    // Time validation
    const selectedTime = String(
      form.appointment_time || ""
    ).trim();

    if (!selectedTime) {
      alert("Please select the appointment time.");
      return;
    }

    // Location validation
    if (!form.location.trim()) {
      alert("Please enter the hospital or clinic.");
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

      const appointmentData = {
        user_id: user.id,
        doctor_name: form.doctor_name.trim(),
        specialization: form.specialization.trim(),

        // Explicitly use the selected date
        appointment_date: selectedDate,

        // Explicitly use the selected time
        appointment_time: selectedTime,

        location: form.location.trim(),
        appointment_type: form.appointment_type,
        reason: form.reason.trim() || null,
        status: "Upcoming",
      };

      console.log(
        "DATA BEING SENT TO SUPABASE:",
        appointmentData
      );

      const { data, error } = await supabase
        .from("appointments")
        .insert([appointmentData])
        .select();

      if (error) {
        console.error(
          "SUPABASE INSERT ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      console.log(
        "APPOINTMENT SAVED:",
        data
      );

      alert("Appointment added successfully!");

      resetForm();
      setShowModal(false);

      await loadAppointments();
    } catch (error) {
      console.error(
        "Unexpected appointment error:",
        error
      );

      alert(
        "Something went wrong while adding the appointment."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DELETE APPOINTMENT
  // --------------------------------------------------
  const deleteAppointment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "Error deleting appointment:",
          error
        );

        alert(error.message);
        return;
      }

      await loadAppointments();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // UPDATE STATUS
  // --------------------------------------------------
  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error(
          "Error updating appointment:",
          error
        );

        alert(error.message);
        return;
      }

      await loadAppointments();
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return dateString;
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
  const formatTime = (timeString) => {
    if (
      !timeString ||
      typeof timeString !== "string" ||
      !timeString.includes(":")
    ) {
      return "";
    }

    const [hours, minutes] =
      timeString.split(":");

    const hourNumber = Number(hours);

    if (
      Number.isNaN(hourNumber) ||
      !minutes
    ) {
      return "";
    }

    const period =
      hourNumber >= 12 ? "PM" : "AM";

    let hour = hourNumber % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${String(hour).padStart(
      2,
      "0"
    )}:${minutes} ${period}`;
  };

  // --------------------------------------------------
  // SUMMARY COUNTS
  // --------------------------------------------------
  const upcomingCount =
    appointments.filter(
      (appointment) =>
        appointment.status === "Upcoming"
    ).length;

  const completedCount =
    appointments.filter(
      (appointment) =>
        appointment.status === "Completed"
    ).length;

  const cancelledCount =
    appointments.filter(
      (appointment) =>
        appointment.status === "Cancelled"
    ).length;

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-slate-600">
            Loading appointments...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CalendarDays
                className="text-blue-600"
                size={26}
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Appointments
              </h1>

              <p className="text-slate-500 mt-1">
                Manage doctor visits and medical appointments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            <Plus size={20} />
            Add Appointment
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {/* UPCOMING */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Upcoming
                </p>

                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {upcomingCount}
                </p>
              </div>

              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CalendarDays
                  className="text-blue-600"
                  size={24}
                />
              </div>
            </div>
          </div>

          {/* COMPLETED */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="text-3xl font-bold text-green-600 mt-2">
                  {completedCount}
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

          {/* CANCELLED */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Cancelled
                </p>

                <p className="text-3xl font-bold text-red-600 mt-2">
                  {cancelledCount}
                </p>
              </div>

              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle
                  className="text-red-600"
                  size={24}
                />
              </div>
            </div>
          </div>
        </div>

        {/* APPOINTMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Your Appointments
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Keep track of upcoming and previous medical visits
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-16">

              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays
                  className="text-blue-600"
                  size={30}
                />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                No appointments yet
              </h3>

              <p className="text-slate-500 mt-2 mb-5">
                Add your first medical appointment.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowModal(true)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
              >
                Add Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {appointments.map(
                (appointment) => {

                  let statusClass =
                    "bg-blue-100 text-blue-700";

                  if (
                    appointment.status ===
                    "Completed"
                  ) {
                    statusClass =
                      "bg-green-100 text-green-700";
                  }

                  if (
                    appointment.status ===
                    "Cancelled"
                  ) {
                    statusClass =
                      "bg-red-100 text-red-700";
                  }

                  return (
                    <div
                      key={appointment.id}
                      className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition"
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        {/* DOCTOR */}
                        <div className="flex items-start gap-4">

                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                            <Stethoscope
                              className="text-blue-600"
                              size={24}
                            />
                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-lg font-bold text-slate-900">
                                {
                                  appointment.doctor_name
                                }
                              </h3>

                              <span
                                className={
                                  "rounded-full px-3 py-1 text-xs font-semibold " +
                                  statusClass
                                }
                              >
                                {
                                  appointment.status
                                }
                              </span>
                            </div>

                            <p className="text-blue-600 font-medium mt-1">
                              {
                                appointment.specialization
                              }
                            </p>

                            {appointment.reason && (
                              <p className="text-sm text-slate-500 mt-2">
                                {
                                  appointment.reason
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {/* DETAILS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">

                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={17}
                              className="text-blue-600"
                            />

                            <span>
                              {formatDate(
                                appointment.appointment_date
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock
                              size={17}
                              className="text-blue-600"
                            />

                            <span>
                              {formatTime(
                                appointment.appointment_time
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin
                              size={17}
                              className="text-blue-600"
                            />

                            <span>
                              {
                                appointment.location
                              }
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <UserRound
                              size={17}
                              className="text-blue-600"
                            />

                            <span>
                              {
                                appointment.appointment_type
                              }
                            </span>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-2">

                          {appointment.status ===
                            "Upcoming" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatus(
                                    appointment.id,
                                    "Completed"
                                  )
                                }
                                className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold"
                              >
                                Complete
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateStatus(
                                    appointment.id,
                                    "Cancelled"
                                  )
                                }
                                className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteAppointment(
                                appointment.id
                              )
                            }
                            className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center"
                            title="Delete appointment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD APPOINTMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Appointment
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Add doctor and appointment details
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

              {/* DOCTOR + SPECIALIZATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Doctor Name
                  </label>

                  <input
                    type="text"
                    name="doctor_name"
                    value={form.doctor_name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Specialization
                  </label>

                  <input
                    type="text"
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Cardiologist"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* DATE + TIME */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* DATE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Appointment Date
                  </label>

                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={handleDateChange}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <p className="text-xs mt-2">
                    {form.appointment_date ? (
                      <span className="text-green-600">
                        Selected date:{" "}
                        {formatDate(
                          form.appointment_date
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        No date selected
                      </span>
                    )}
                  </p>
                </div>

                {/* TIME */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Appointment Time
                  </label>

                  <input
                    type="time"
                    value={form.appointment_time}
                    onChange={handleTimeChange}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <p className="text-xs mt-2">
                    {form.appointment_time ? (
                      <span className="text-green-600">
                        Selected time:{" "}
                        {formatTime(
                          form.appointment_time
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        No time selected
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* LOCATION */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hospital / Clinic
                </label>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. City Care Hospital"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* APPOINTMENT TYPE */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Appointment Type
                </label>

                <select
                  name="appointment_type"
                  value={form.appointment_type}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="In-person">
                    In-person
                  </option>

                  <option value="Video Consultation">
                    Video Consultation
                  </option>

                  <option value="Phone Consultation">
                    Phone Consultation
                  </option>
                </select>
              </div>

              {/* REASON */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reason / Notes
                  <span className="text-slate-400 font-normal ml-1">
                    (Optional)
                  </span>
                </label>

                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="e.g. Routine heart check-up"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                onClick={addAppointment}
                disabled={saving}
                className="flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold"
              >
                {saving
                  ? "Adding..."
                  : "Add Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;