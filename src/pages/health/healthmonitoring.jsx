import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

import {
Activity,
HeartPulse,
Droplets,
Moon,
Weight,
Gauge,
Plus,
Trash2,
ArrowUp,
ArrowDown,
Minus,
} from "lucide-react";

function HealthMonitoring() {
const [records, setRecords] = useState([]);
const [showModal, setShowModal] = useState(false);
const [saving, setSaving] = useState(false);

const [form, setForm] = useState({
type: "Heart Rate",
value: "",
unit: "bpm",
status: "Normal",
});

const demoMetrics = {
"Heart Rate": {
value: "72",
unit: "bpm",
status: "Normal",
},

"Blood Oxygen": {
  value: "98",
  unit: "%",
  status: "Normal",
},

"Blood Pressure": {
  value: "120/80",
  unit: "mmHg",
  status: "Normal",
},

Hydration: {
  value: "2.0",
  unit: "L",
  status: "Good",
},

Sleep: {
  value: "7.5",
  unit: "hrs",
  status: "Good",
},

Weight: {
  value: "60",
  unit: "kg",
  status: "Stable",
},

};

// --------------------------------------------------
// LOAD HEALTH RECORDS
// --------------------------------------------------

const loadHealthRecords = async () => {
try {
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
    .from("health_records")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Error loading health records:",
      error
    );
    return;
  }

  const formattedRecords = (data || []).map(
    (record) => {
      const recordDate = record.recorded_at
        ? new Date(record.recorded_at)
        : new Date();

      return {
        id: record.id,
        type: record.type,
        value: record.value,
        unit: record.unit,
        status: record.status,
        recordedAt: record.recorded_at,
        date: recordDate.toLocaleDateString(),
        time: recordDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }
  );

  setRecords(formattedRecords);
} catch (error) {
  console.error(
    "Unexpected error:",
    error
  );
}

};

// --------------------------------------------------
// INITIAL LOAD + REALTIME
// --------------------------------------------------

useEffect(() => {
let isMounted = true;

const initializeHealthPage = async () => {
  if (!isMounted) {
    return;
  }

  await loadHealthRecords();
};

initializeHealthPage();

const healthChannel = supabase
  .channel("health-monitoring-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "health_records",
    },
    () => {
      loadHealthRecords();
    }
  )
  .subscribe((status) => {
    console.log(
      "Health realtime status:",
      status
    );
  });

return () => {
  isMounted = false;
  supabase.removeChannel(
    healthChannel
  );
};

}, []);

// --------------------------------------------------
// GET LATEST REAL RECORD
// --------------------------------------------------

const getLatestRecord = (type) => {
const normalizedType = type
.trim()
.toLowerCase();

return records.find((record) => {
  if (!record.type) {
    return false;
  }

  return (
    record.type
      .trim()
      .toLowerCase() === normalizedType
  );
});

};

// --------------------------------------------------
// CREATE METRIC
// --------------------------------------------------

const createMetric = (title, icon) => {
const realRecord =
getLatestRecord(title);

const demo = demoMetrics[title];

if (realRecord) {
  return {
    title,
    value: realRecord.value,
    unit:
      realRecord.unit || demo.unit,
    status:
      realRecord.status || "Normal",
    icon,
    isDemo: false,
  };
}

return {
  title,
  value: demo.value,
  unit: demo.unit,
  status: demo.status,
  icon,
  isDemo: true,
};

};

// --------------------------------------------------
// HEALTH METRICS
// --------------------------------------------------

const metrics = [
createMetric(
"Heart Rate",
HeartPulse
),

createMetric(
  "Blood Oxygen",
  Activity
),

createMetric(
  "Blood Pressure",
  Gauge
),

createMetric(
  "Hydration",
  Droplets
),

createMetric(
  "Sleep",
  Moon
),

createMetric(
  "Weight",
  Weight
),

];

// --------------------------------------------------
// CHANGE MEASUREMENT TYPE
// --------------------------------------------------

const handleTypeChange = (event) => {
const type = event.target.value;

let unit = "bpm";

if (type === "Blood Oxygen") {
  unit = "%";
}

if (type === "Blood Pressure") {
  unit = "mmHg";
}

if (type === "Hydration") {
  unit = "L";
}

if (type === "Sleep") {
  unit = "hrs";
}

if (type === "Weight") {
  unit = "kg";
}

setForm({
  type,
  value: "",
  unit,
  status: "Normal",
});

};

// --------------------------------------------------
// ADD HEALTH RECORD
// --------------------------------------------------

const addRecord = async () => {
if (!form.value.trim()) {
alert("Please enter a value.");
return;
}

setSaving(true);

try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(userError);

    alert(
      "Unable to verify your account."
    );

    return;
  }

  if (!user) {
    alert("Please login again.");
    return;
  }

  const recordToInsert = {
    user_id: user.id,
    type: form.type,
    value: form.value,
    unit: form.unit,
    status: form.status,
  };

  const { data, error } = await supabase
    .from("health_records")
    .insert(recordToInsert)
    .select()
    .single();

  if (error) {
    console.error(
      "INSERT ERROR:",
      error
    );

    alert(
      "Failed to save record: " +
        error.message
    );

    return;
  }

  console.log(
    "RECORD SAVED:",
    data
  );

  setForm({
    type: "Heart Rate",
    value: "",
    unit: "bpm",
    status: "Normal",
  });

  setShowModal(false);

  await loadHealthRecords();

  alert(
    "Health record saved successfully."
  );
} catch (error) {
  console.error(
    "Unexpected error:",
    error
  );

  alert(
    "Something went wrong."
  );
} finally {
  setSaving(false);
}

};

// --------------------------------------------------
// DELETE RECORD
// --------------------------------------------------

const deleteRecord = async (id) => {
const { error } = await supabase
.from("health_records")
.delete()
.eq("id", id);

if (error) {
  console.error(
    "Delete error:",
    error
  );

  alert(
    "Failed to delete record: " +
      error.message
  );

  return;
}

await loadHealthRecords();

};

// --------------------------------------------------
// STATUS STYLE
// --------------------------------------------------

const getStatusClass = (status) => {
if (status === "High") {
return "bg-red-100 text-red-700";
}

if (status === "Low") {
  return "bg-yellow-100 text-yellow-700";
}

if (status === "Good") {
  return "bg-emerald-100 text-emerald-700";
}

if (status === "Stable") {
  return "bg-blue-100 text-blue-700";
}

return "bg-green-100 text-green-700";

};

// --------------------------------------------------
// STATUS ICON
// --------------------------------------------------

const getStatusIcon = (status) => {
if (status === "High") {
return <ArrowUp size={14} />;
}

if (status === "Low") {
  return <ArrowDown size={14} />;
}

return <Minus size={14} />;

};

// --------------------------------------------------
// UI
// --------------------------------------------------

return ( <div className="min-h-screen bg-slate-50 p-6 md:p-8">

  {/* HEADER */}

  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

    <div>

      <p className="text-sm font-medium text-blue-600">
        VitalCare Professional
      </p>

      <h1 className="mt-1 text-3xl font-bold text-slate-900">
        Health Monitoring
      </h1>

      <p className="mt-2 text-slate-600">
        Monitor and manage important
        health measurements.
      </p>

    </div>

    <button
      onClick={() =>
        setShowModal(true)
      }
      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
    >
      <Plus size={20} />
      Add Health Record
    </button>

  </div>

  {/* HEALTH CARDS */}

  <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

    {metrics.map((metric) => {
      const Icon = metric.icon;

      return (
        <div
          key={metric.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={22} />
            </div>

            <span
              className={
                "rounded-full px-3 py-1 text-xs font-semibold " +
                getStatusClass(
                  metric.status
                )
              }
            >
              {metric.status}
            </span>

          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            {metric.title}
          </p>

          <div className="mt-1 flex items-baseline gap-2">

            <span className="text-3xl font-bold text-slate-900">
              {metric.value}
            </span>

            <span className="text-sm text-slate-500">
              {metric.unit}
            </span>

          </div>

          {metric.isDemo && (
            <p className="mt-2 text-xs text-slate-400">
              Demo value
            </p>
          )}

          {!metric.isDemo && (
            <p className="mt-2 text-xs text-emerald-600">
              Live data
            </p>
          )}

        </div>
      );
    })}

  </div>

  {/* AI INSIGHT */}

  <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">

    <div className="flex items-start gap-4">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Activity size={22} />
      </div>

      <div>

        <h2 className="text-lg font-bold text-slate-900">
          AI Health Insight
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Health measurements are
          continuously monitored.
          New records are reflected
          automatically on this page.
        </p>

      </div>

    </div>

  </div>

  {/* RECENT RECORDS */}

  <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

    <div className="flex flex-col gap-2 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

      <div>

        <h2 className="text-xl font-bold text-slate-900">
          Recent Health Records
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest measurements recorded
          for the user.
        </p>

      </div>

      <span className="text-sm font-medium text-slate-500">
        {records.length} records
      </span>

    </div>

    <div className="overflow-x-auto">

      {records.length === 0 ? (

        <div className="p-10 text-center">

          <Activity
            size={40}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 font-medium text-slate-700">
            No health records yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Add your first health
            measurement.
          </p>

        </div>

      ) : (

        <table className="w-full min-w-[700px]">

          <thead>

            <tr className="border-b border-slate-200 bg-slate-50 text-left">

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Measurement
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Value
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Time
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {records.map((record) => (

              <tr
                key={record.id}
                className="border-b border-slate-100 last:border-0"
              >

                <td className="px-6 py-4 font-semibold text-slate-900">
                  {record.type}
                </td>

                <td className="px-6 py-4">

                  <span className="font-semibold text-slate-900">
                    {record.value}
                  </span>

                  <span className="ml-2 text-sm text-slate-500">
                    {record.unit}
                  </span>

                </td>

                <td className="px-6 py-4">

                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold " +
                      getStatusClass(
                        record.status
                      )
                    }
                  >

                    {getStatusIcon(
                      record.status
                    )}

                    {record.status}

                  </span>

                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {record.date}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {record.time}
                </td>

                <td className="px-6 py-4">

                  <button
                    onClick={() =>
                      deleteRecord(
                        record.id
                      )
                    }
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  >

                    <Trash2
                      size={18}
                    />

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  </div>

  {/* TODAY'S SUMMARY */}

  <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

    <h2 className="text-lg font-bold text-slate-900">
      Today's Summary
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Latest health measurements.
    </p>

    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

      {metrics
        .slice(0, 4)
        .map((metric) => {

          const Icon =
            metric.icon;

          return (
            <div
              key={metric.title}
              className="rounded-xl bg-slate-50 p-4"
            >

              <div className="flex items-center gap-3">

                <Icon
                  size={20}
                  className="text-blue-500"
                />

                <span className="font-medium text-slate-700">
                  {metric.title}
                </span>

              </div>

              <p className="mt-3 text-xl font-bold text-slate-900">

                {metric.value}

                <span className="ml-1 text-sm font-normal text-slate-500">
                  {metric.unit}
                </span>

              </p>

            </div>
          );
        })}

    </div>

  </div>

  {/* ADD RECORD MODAL */}

  {showModal && (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">

        <div className="flex items-start justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Add Health Record
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter a new health
              measurement.
            </p>

          </div>

          <button
            onClick={() =>
              setShowModal(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>

        </div>

        <div className="mt-6 space-y-5">

          {/* TYPE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Measurement Type
            </label>

            <select
              value={form.type}
              onChange={
                handleTypeChange
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >

              <option value="Heart Rate">
                Heart Rate
              </option>

              <option value="Blood Oxygen">
                Blood Oxygen
              </option>

              <option value="Blood Pressure">
                Blood Pressure
              </option>

              <option value="Hydration">
                Hydration
              </option>

              <option value="Sleep">
                Sleep
              </option>

              <option value="Weight">
                Weight
              </option>

            </select>

          </div>

          {/* VALUE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Value
            </label>

            <div className="flex">

              <input
                type="text"
                value={form.value}
                onChange={(event) =>
                  setForm({
                    ...form,
                    value:
                      event.target
                        .value,
                  })
                }
                placeholder={
                  form.type ===
                  "Blood Pressure"
                    ? "120/80"
                    : "Enter value"
                }
                className="w-full rounded-l-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <div className="flex items-center rounded-r-xl border border-l-0 border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                {form.unit}
              </div>

            </div>

          </div>

          {/* STATUS */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Status
            </label>

            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status:
                    event.target
                      .value,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >

              <option value="Normal">
                Normal
              </option>

              <option value="Good">
                Good
              </option>

              <option value="Stable">
                Stable
              </option>

              <option value="High">
                High
              </option>

              <option value="Low">
                Low
              </option>

            </select>

          </div>

        </div>

        <div className="mt-7 flex gap-3">

          <button
            onClick={() =>
              setShowModal(false)
            }
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={addRecord}
            disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Record"}
          </button>

        </div>

      </div>

    </div>

  )}

</div>

);
}

export default HealthMonitoring;
