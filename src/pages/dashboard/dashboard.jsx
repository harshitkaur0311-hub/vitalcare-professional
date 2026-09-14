import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
LayoutDashboard,
Camera,
HeartPulse,
Pill,
CalendarDays,
Bell,
Settings,
Activity,
ShieldCheck,
AlertTriangle,
Clock,
} from "lucide-react";
import { supabase } from "../../services/supabase";

function Dashboard() {
const navigate = useNavigate();

const [profile, setProfile] = useState(null);
const [healthRecords, setHealthRecords] = useState([]);
const [medications, setMedications] = useState([]);
const [appointments, setAppointments] = useState([]);
const [alerts, setAlerts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
let isMounted = true;

const loadDashboardData = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Unable to get user:", userError);

      if (isMounted) {
        setLoading(false);
      }

      return;
    }

    const [
      profileResult,
      healthResult,
      medicationResult,
      appointmentResult,
      alertResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single(),

      supabase
        .from("health_records")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false }),

      supabase
        .from("medications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true }),

      supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (!isMounted) {
      return;
    }

    if (profileResult.error) {
      console.error(
        "Unable to load profile:",
        profileResult.error
      );
    } else {
      setProfile(profileResult.data);
    }

    if (healthResult.error) {
      console.error(
        "Unable to load health records:",
        healthResult.error
      );
    } else {
      setHealthRecords(healthResult.data || []);
    }

    if (medicationResult.error) {
      console.error(
        "Unable to load medications:",
        medicationResult.error
      );
    } else {
      setMedications(
        medicationResult.data || []
      );
    }

    if (appointmentResult.error) {
      console.error(
        "Unable to load appointments:",
        appointmentResult.error
      );
    } else {
      setAppointments(
        appointmentResult.data || []
      );
    }

    if (alertResult.error) {
      console.error(
        "Unable to load alerts:",
        alertResult.error
      );
    } else {
      setAlerts(alertResult.data || []);
    }
  } catch (error) {
    console.error(
      "Dashboard loading error:",
      error
    );
  } finally {
    if (isMounted) {
      setLoading(false);
    }
  }
};

loadDashboardData();

const alertsChannel = supabase
  .channel("dashboard-alerts")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "alerts",
    },
    () => {
      loadDashboardData();
    }
  )
  .subscribe((status) => {
    console.log(
      "Alerts realtime:",
      status
    );
  });

const healthChannel = supabase
  .channel("dashboard-health")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "health_records",
    },
    () => {
      loadDashboardData();
    }
  )
  .subscribe((status) => {
    console.log(
      "Health realtime:",
      status
    );
  });

const medicationsChannel = supabase
  .channel("dashboard-medications")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "medications",
    },
    () => {
      loadDashboardData();
    }
  )
  .subscribe((status) => {
    console.log(
      "Medications realtime:",
      status
    );
  });

const appointmentsChannel = supabase
  .channel("dashboard-appointments")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "appointments",
    },
    () => {
      loadDashboardData();
    }
  )
  .subscribe((status) => {
    console.log(
      "Appointments realtime:",
      status
    );
  });

return () => {
  isMounted = false;

  supabase.removeChannel(
    alertsChannel
  );

  supabase.removeChannel(
    healthChannel
  );

  supabase.removeChannel(
    medicationsChannel
  );

  supabase.removeChannel(
    appointmentsChannel
  );
};

}, []);

const handleLogout = async () => {
const { error } =
await supabase.auth.signOut();

if (error) {
  console.error(
    "Logout error:",
    error
  );
  return;
}

localStorage.removeItem(
  "vitalcareRole"
);

navigate("/login");

};

const fullName =
profile?.full_name ||
"VitalCare User";

const roleNames = {
admin: "Administrator",
caregiver: "Caregiver",
user: "User / Elder",
};

const roleName =
roleNames[profile?.role] ||
"Caregiver";

const initials = fullName
.split(" ")
.filter(Boolean)
.map((name) => name[0])
.join("")
.slice(0, 2)
.toUpperCase();

const findLatestHealthValue = (
types
) => {
return (
healthRecords.find((item) =>
types.some(
(type) =>
String(
item.type
).toLowerCase() ===
type.toLowerCase()
)
) || null
);
};

const heartRateRecord =
findLatestHealthValue([
"Heart Rate",
"HeartRate",
"heart_rate",
]);

const spo2Record =
findLatestHealthValue([
"SpO2",
"SpO₂",
"Blood Oxygen",
"blood_oxygen",
]);

const heartRateValue =
heartRateRecord?.value || "--";

const heartRateUnit =
heartRateRecord?.unit || "BPM";

const spo2Value =
spo2Record?.value || "--";

const spo2Unit =
spo2Record?.unit || "%";

const activeMedications =
medications.filter(
(medication) =>
medication.active !== false
);

const upcomingAppointments =
appointments.filter(
(appointment) =>
appointment.status === "Upcoming"
);

const unreadAlerts =
alerts.filter(
(alert) =>
alert.status === "Unread"
);

const criticalAlerts =
alerts.filter(
(alert) =>
alert.severity === "Critical" &&
alert.status !== "Resolved"
);

const nextAppointment =
upcomingAppointments[0] || null;

const formatAppointmentDate = (
date
) => {
if (!date) {
return "No upcoming appointment";
}

const appointmentDate =
  new Date(
    date + "T00:00:00"
  );

return appointmentDate.toLocaleDateString(
  "en-IN",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
);

};

const formatTime = (time) => {
if (!time) {
return "";
}

const timeParts =
  time.split(":");

const hours =
  Number(timeParts[0]);

const minutes =
  Number(timeParts[1]);

const date = new Date();

date.setHours(hours);
date.setMinutes(minutes);

return date.toLocaleTimeString(
  "en-IN",
  {
    hour: "numeric",
    minute: "2-digit",
  }
);

};

const formatRelativeTime =
(createdAt) => {
if (!createdAt) {
return "";
}

  const created =
    new Date(createdAt);

  const now =
    new Date();

  const diffInSeconds =
    Math.floor(
      (now - created) / 1000
    );

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes =
    Math.floor(
      diffInSeconds / 60
    );

  if (diffInMinutes < 60) {
    return (
      diffInMinutes +
      " min ago"
    );
  }

  const diffInHours =
    Math.floor(
      diffInMinutes / 60
    );

  if (diffInHours < 24) {
    return (
      diffInHours +
      " hr ago"
    );
  }

  const diffInDays =
    Math.floor(
      diffInHours / 24
    );

  if (diffInDays === 1) {
    return "1 day ago";
  }

  return (
    diffInDays +
    " days ago"
  );
};

const getAlertIcon = (
alertType
) => {
switch (alertType) {
case "Emergency":
case "Health":
return ( <HeartPulse
         size={20}
         className="text-red-500"
       />
);

  case "Medication":
    return (
      <Pill
        size={20}
        className="text-purple-600"
      />
    );

  case "Appointment":
    return (
      <CalendarDays
        size={20}
        className="text-blue-600"
      />
    );

  default:
    return (
      <Bell
        size={20}
        className="text-slate-600"
      />
    );
}

};

const getAlertBackground = (
alertType
) => {
switch (alertType) {
case "Emergency":
case "Health":
return "bg-red-100";

  case "Medication":
    return "bg-purple-100";

  case "Appointment":
    return "bg-blue-100";

  default:
    return "bg-slate-100";
}

};

return ( <div className="min-h-screen bg-slate-50">

  {/* SIDEBAR */}
  <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50">

    {/* LOGO */}
    <div className="p-6 border-b border-slate-200">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">

          <HeartPulse
            size={25}
            className="text-white"
          />

        </div>

        <div>

          <h1 className="text-lg font-bold text-slate-900">
            VitalCare
          </h1>

          <p className="text-xs text-slate-500">
            Professional
          </p>

        </div>

      </div>

    </div>

    {/* NAVIGATION */}
    <nav className="p-4 space-y-2">

      <a
        href="/dashboard"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-blue-600 text-white"
      >
        <LayoutDashboard
          size={20}
        />

        <span className="font-medium">
          Dashboard
        </span>
      </a>

      <a
        href="/cameras"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
      >
        <Camera size={20} />

        <span className="font-medium">
          Camera Monitoring
        </span>
      </a>

      <a
        href="/health"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
      >
        <HeartPulse
          size={20}
        />

        <span className="font-medium">
          Health
        </span>
      </a>

      <a
        href="/medications"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
      >
        <Pill size={20} />

        <span className="font-medium">
          Medications
        </span>
      </a>

      <a
        href="/appointments"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
      >
        <CalendarDays
          size={20}
        />

        <span className="font-medium">
          Appointments
        </span>
      </a>

      <a
        href="/alerts"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
      >
        <Bell size={20} />

        <span className="font-medium">
          Alerts
        </span>

        {unreadAlerts.length >
          0 && (
          <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">
            {unreadAlerts.length}
          </span>
        )}

      </a>

      <a
        href="/settings"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition"
      >
        <Settings
          size={20}
        />

        <span className="font-medium">
          Settings
        </span>
      </a>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer"
      >
        <span className="text-lg">
          ↪
        </span>

        <span className="font-medium">
          Logout
        </span>
      </button>

    </nav>

    {/* AI PROTECTION */}
    <div className="absolute bottom-0 left-0 right-0 p-4">

      <div className="bg-blue-50 rounded-xl p-4">

        <div className="flex items-center gap-2 mb-2">

          <ShieldCheck
            size={20}
            className="text-blue-600"
          />

          <span className="font-semibold text-slate-800">
            AI Protection
          </span>

        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          AI-powered safety monitoring is active.
        </p>

      </div>

    </div>

  </aside>

  {/* MAIN */}
  <main className="ml-64">

    {/* HEADER */}
    <header className="bg-white border-b border-slate-200 px-8 py-5">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Welcome back to VitalCare Professional
          </p>

        </div>

        {/* PROFILE */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">

            <span className="text-blue-700 font-semibold">
              {initials || "U"}
            </span>

          </div>

          <div>

            <p className="text-sm font-semibold text-slate-800">
              {fullName}
            </p>

            <p className="text-xs text-slate-500">
              {roleName}
            </p>

          </div>

        </div>

      </div>

    </header>

    {/* CONTENT */}
    <div className="p-8">

      {/* OVERVIEW */}
      <div className="mb-8">

        <h3 className="text-xl font-bold text-slate-900">
          Overview
        </h3>

        <p className="text-slate-500 mt-1">
          Monitor health, safety and daily activities from one place.
        </p>

        {profile?.email && (
          <p className="text-xs text-slate-400 mt-1">
            {profile.email}
          </p>
        )}

      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* HEART RATE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center justify-between">

            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">

              <HeartPulse
                size={22}
                className="text-red-500"
              />

            </div>

            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {heartRateRecord?.status ||
                "No Data"}
            </span>

          </div>

          <p className="text-sm text-slate-500 mt-5">
            Heart Rate
          </p>

          <div className="flex items-end gap-2 mt-1">

            <span className="text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : heartRateValue}
            </span>

            <span className="text-sm text-slate-500 mb-1">
              {heartRateUnit}
            </span>

          </div>

        </div>

        {/* SPO2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center justify-between">

            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">

              <Activity
                size={22}
                className="text-blue-600"
              />

            </div>

            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {spo2Record?.status ||
                "No Data"}
            </span>

          </div>

          <p className="text-sm text-slate-500 mt-5">
            Blood Oxygen
          </p>

          <div className="flex items-end gap-2 mt-1">

            <span className="text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : spo2Value}
            </span>

            <span className="text-sm text-slate-500 mb-1">
              {spo2Unit}
            </span>

          </div>

        </div>

        {/* MEDICATIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center justify-between">

            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">

              <Pill
                size={22}
                className="text-purple-600"
              />

            </div>

            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Active
            </span>

          </div>

          <p className="text-sm text-slate-500 mt-5">
            Medications
          </p>

          <div className="flex items-end gap-2 mt-1">

            <span className="text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : activeMedications.length}
            </span>

            <span className="text-sm text-slate-500 mb-1">
              Active
            </span>

          </div>

        </div>

        {/* APPOINTMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center justify-between">

            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">

              <CalendarDays
                size={22}
                className="text-green-600"
              />

            </div>

            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Upcoming
            </span>

          </div>

          <p className="text-sm text-slate-500 mt-5">
            Appointments
          </p>

          <div className="flex items-end gap-2 mt-1">

            <span className="text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : upcomingAppointments.length}
            </span>

            <span className="text-sm text-slate-500 mb-1">
              Scheduled
            </span>

          </div>

        </div>

      </div>

      {/* CAMERA + AI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* CAMERA */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                Camera Monitoring
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Live safety monitoring
              </p>

            </div>

            <div className="flex items-center gap-2 text-sm text-green-600">

              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>

              Live

            </div>

          </div>

          <a
            href="/cameras"
            className="block aspect-video bg-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-800 transition"
          >

            <div className="text-center">

              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">

                <Camera
                  size={30}
                  className="text-slate-300"
                />

              </div>

              <p className="text-white font-semibold">
                Camera Monitoring
              </p>

              <p className="text-slate-400 text-sm mt-1">
                Click to open live camera
              </p>

            </div>

          </a>

          <div className="mt-4 flex items-center justify-between">

            <div>

              <p className="font-semibold text-slate-800">
                CAM-001
              </p>

              <p className="text-sm text-slate-500">
                Main Room Camera
              </p>

            </div>

            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              Connected
            </span>

          </div>

          <a
            href="/cameras"
            className="inline-block mt-4 text-sm font-semibold text-blue-600"
          >
            Open Camera Monitoring →
          </a>

        </div>

        {/* AI SAFETY */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                AI Safety Status
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Real-time monitoring
              </p>

            </div>

            <ShieldCheck
              size={24}
              className="text-green-600"
            />

          </div>

          <div className="space-y-4">

            {/* FALL */}
            <div
              className={
                criticalAlerts.length > 0
                  ? "p-4 rounded-xl bg-red-50"
                  : "p-4 rounded-xl bg-green-50"
              }
            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">

                    <AlertTriangle
                      size={19}
                      className={
                        criticalAlerts.length > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    />

                  </div>

                  <div>

                    <p className="font-semibold text-slate-800">
                      Fall Detection
                    </p>

                    <p className="text-xs text-slate-500">
                      {criticalAlerts.length > 0
                        ? "Critical alert detected"
                        : "No fall detected"}
                    </p>

                  </div>

                </div>

                <span
                  className={
                    criticalAlerts.length > 0
                      ? "text-xs font-semibold text-red-600"
                      : "text-xs font-semibold text-green-600"
                  }
                >
                  {criticalAlerts.length > 0
                    ? "Alert"
                    : "Normal"}
                </span>

              </div>

            </div>

            {/* INACTIVITY */}
            <div className="p-4 bg-green-50 rounded-xl">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">

                    <Clock
                      size={19}
                      className="text-green-600"
                    />

                  </div>

                  <div>

                    <p className="font-semibold text-slate-800">
                      Inactivity Detection
                    </p>

                    <p className="text-xs text-slate-500">
                      Normal activity
                    </p>

                  </div>

                </div>

                <span className="text-xs font-semibold text-green-600">
                  Normal
                </span>

              </div>

            </div>

            {/* ACTIVITY */}
            <div className="p-4 bg-blue-50 rounded-xl">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">

                    <Activity
                      size={19}
                      className="text-blue-600"
                    />

                  </div>

                  <div>

                    <p className="font-semibold text-slate-800">
                      Activity Monitoring
                    </p>

                    <p className="text-xs text-slate-500">
                      AI monitoring active
                    </p>

                  </div>

                </div>

                <span className="text-xs font-semibold text-blue-600">
                  Active
                </span>

              </div>

            </div>

            {/* OVERALL */}
            <div
              className={
                criticalAlerts.length > 0
                  ? "border border-red-200 rounded-xl p-4"
                  : "border border-green-200 rounded-xl p-4"
              }
            >

              <div className="flex items-center gap-3">

                <div
                  className={
                    criticalAlerts.length > 0
                      ? "w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
                      : "w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"
                  }
                >

                  <ShieldCheck
                    size={22}
                    className={
                      criticalAlerts.length > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  />

                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    Overall Safety
                  </p>

                  <p
                    className={
                      criticalAlerts.length > 0
                        ? "text-sm text-red-600"
                        : "text-sm text-green-600"
                    }
                  >
                    {criticalAlerts.length > 0
                      ? "Immediate attention required"
                      : "Elder is currently safe"}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* QUICK HEALTH + APPOINTMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* NEXT APPOINTMENT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                Next Appointment
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Upcoming healthcare appointment
              </p>

            </div>

            <CalendarDays
              size={24}
              className="text-blue-600"
            />

          </div>

          {nextAppointment ? (
            <div className="bg-blue-50 rounded-xl p-4">

              <p className="font-bold text-slate-900">
                Dr.{" "}
                {nextAppointment.doctor_name}
              </p>

              <p className="text-sm text-slate-600 mt-1">
                {nextAppointment.specialization}
              </p>

              <div className="flex flex-wrap gap-3 mt-4 text-sm">

                <span className="bg-white px-3 py-2 rounded-lg text-slate-700">
                  {formatAppointmentDate(
                    nextAppointment.appointment_date
                  )}
                </span>

                <span className="bg-white px-3 py-2 rounded-lg text-slate-700">
                  {formatTime(
                    nextAppointment.appointment_time
                  )}
                </span>

              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-5 text-center">

              <CalendarDays
                size={28}
                className="text-slate-400 mx-auto"
              />

              <p className="text-sm text-slate-500 mt-2">
                No upcoming appointments
              </p>

            </div>
          )}

          <a
            href="/appointments"
            className="inline-block mt-4 text-sm font-semibold text-blue-600"
          >
            View Appointments →
          </a>

        </div>

        {/* MEDICATION SUMMARY */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                Medication Summary
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Current active medications
              </p>

            </div>

            <Pill
              size={24}
              className="text-purple-600"
            />

          </div>

          {activeMedications.length >
          0 ? (
            <div className="space-y-3">

              {activeMedications
                .slice(0, 3)
                .map((medication) => (
                  <div
                    key={
                      medication.id
                    }
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-xl"
                  >

                    <div>

                      <p className="font-semibold text-slate-800">
                        {medication.name}
                      </p>

                      <p className="text-xs text-slate-500">

                        {medication.dosage}

                        {medication.frequency
                          ? " • " +
                            medication.frequency
                          : ""}

                      </p>

                    </div>

                    {medication.timing && (
                      <span className="text-xs font-medium text-purple-700 bg-white px-2.5 py-1 rounded-full">
                        {medication.timing}
                      </span>
                    )}

                  </div>
                ))}

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-5 text-center">

              <Pill
                size={28}
                className="text-slate-400 mx-auto"
              />

              <p className="text-sm text-slate-500 mt-2">
                No active medications
              </p>

            </div>
          )}

          <a
            href="/medications"
            className="inline-block mt-4 text-sm font-semibold text-blue-600"
          >
            View Medications →
          </a>

        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h3 className="text-lg font-bold text-slate-900">
              Recent Activity
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Latest system events
            </p>

          </div>

          <a
            href="/alerts"
            className="text-sm font-semibold text-blue-600"
          >
            View All
          </a>

        </div>

        {alerts.length > 0 ? (
          <div className="space-y-4">

            {alerts
              .slice(0, 5)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50"
                >

                  <div
                    className={
                      "w-10 h-10 rounded-full flex items-center justify-center " +
                      getAlertBackground(
                        alert.alert_type
                      )
                    }
                  >
                    {getAlertIcon(
                      alert.alert_type
                    )}
                  </div>

                  <div className="flex-1">

                    <p className="font-medium text-slate-800">
                      {alert.title}
                    </p>

                    <p className="text-sm text-slate-500">
                      {alert.message}
                    </p>

                  </div>

                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatRelativeTime(
                      alert.created_at
                    )}
                  </span>

                </div>
              ))}

          </div>
        ) : (
          <div className="space-y-4">

            {/* HEALTH */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">

              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">

                <HeartPulse
                  size={20}
                  className="text-green-600"
                />

              </div>

              <div className="flex-1">

                <p className="font-medium text-slate-800">
                  Health monitoring ready
                </p>

                <p className="text-sm text-slate-500">
                  Your latest health records will appear here.
                </p>

              </div>

              <span className="text-xs text-slate-400">
                Today
              </span>

            </div>

            {/* CAMERA */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">

              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">

                <Camera
                  size={20}
                  className="text-blue-600"
                />

              </div>

              <div className="flex-1">

                <p className="font-medium text-slate-800">
                  Camera monitoring active
                </p>

                <p className="text-sm text-slate-500">
                  AI safety monitoring is available.
                </p>

              </div>

              <span className="text-xs text-slate-400">
                Today
              </span>

            </div>

            {/* MEDICATION */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">

              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">

                <Pill
                  size={20}
                  className="text-purple-600"
                />

              </div>

              <div className="flex-1">

                <p className="font-medium text-slate-800">
                  Medication tracking active
                </p>

                <p className="text-sm text-slate-500">
                  {activeMedications.length} active medication
                  {activeMedications.length !== 1
                    ? "s"
                    : ""}{" "}
                  currently stored.
                </p>

              </div>

              <span className="text-xs text-slate-400">
                Today
              </span>

            </div>

          </div>
        )}

      </div>

    </div>

  </main>

</div>

);
}

export default Dashboard;
