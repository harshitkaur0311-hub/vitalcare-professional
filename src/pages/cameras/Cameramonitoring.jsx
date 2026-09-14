import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Circle,
  Trash2,
  Plus,
  Play,
  Square,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Clock,
  X,
  Video,
  Brain,
  Wifi,
  WifiOff,
} from "lucide-react";

const AI_API_URL =
  import.meta.env.VITE_AI_API_URL ||
  "https://vitalcare-professional.onrender.com/predict";

const AI_HEALTH_URL =
  import.meta.env.VITE_AI_HEALTH_URL ||
  "https://vitalcare-professional.onrender.com/health";

const SEQUENCE_LENGTH = 30;
const FEATURE_COUNT = 132;
const WINDOW_STEP = 15;

const FALL_THRESHOLD = 65;
const REQUIRED_CONSECUTIVE_WINDOWS = 3;

const initialCameras = [
  {
    id: 1,
    name: "Living Room",
    location: "Main Hall",
    status: "Offline",
  },
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
}

function getStatusClass(status) {
  if (status === "Online") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Recording") {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-600";
}

export default function CameraMonitoring() {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const poseRef = useRef(null);
  const animationFrameRef = useRef(null);

  const sequenceRef = useRef([]);
  const framesSincePredictionRef = useRef(0);
  const poseProcessingRef = useRef(false);
  const highProbabilityWindowsRef = useRef(0);

  const mountedRef = useRef(true);

  const [cameras, setCameras] = useState(initialCameras);
  const [selectedCameraId, setSelectedCameraId] = useState(1);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const [showAddCamera, setShowAddCamera] = useState(false);
  const [newCameraName, setNewCameraName] = useState("");
  const [newCameraLocation, setNewCameraLocation] = useState("");

  const [cameraError, setCameraError] = useState("");
  const [aiError, setAiError] = useState("");

  const [aiStatus, setAiStatus] = useState("Waiting");
  const [aiConnected, setAiConnected] = useState(false);

  const [fallProbability, setFallProbability] = useState(0);
  const [prediction, setPrediction] = useState("WAITING");
  const [fallConfirmed, setFallConfirmed] = useState(false);

  const [
    consecutiveHighWindows,
    setConsecutiveHighWindows,
  ] = useState(0);

  const [poseFrames, setPoseFrames] = useState(0);
  const [sequenceFrames, setSequenceFrames] = useState(0);

  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [inactivityStatus, setInactivityStatus] =
    useState("Normal");

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const selectedCamera =
    cameras.find(
      (camera) => camera.id === selectedCameraId
    ) || cameras[0];

  /* ============================================================
     LOAD MEDIAPIPE
  ============================================================ */

  useEffect(() => {
    mountedRef.current = true;

    const existingScript = document.querySelector(
      'script[data-vitalcare-mediapipe="pose"]'
    );

    if (existingScript) {
      console.log("MediaPipe script already exists.");
    } else {
      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";

      script.async = true;
      script.dataset.vitalcareMediapipe = "pose";

      script.onload = () => {
        console.log("MediaPipe Pose script loaded.");
      };

      script.onerror = () => {
        console.error("Could not load MediaPipe Pose.");

        if (mountedRef.current) {
          setAiError(
            "Could not load MediaPipe Pose. Check your internet connection."
          );
        }
      };

      document.body.appendChild(script);
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ============================================================
     AI BACKEND HEALTH CHECK
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function checkAIBackend() {
      try {
        const response = await fetch(AI_HEALTH_URL);

        if (!response.ok) {
          throw new Error("AI backend health check failed.");
        }

        const data = await response.json();

        console.log("VitalCare AI backend:", data);

        if (!cancelled) {
          setAiConnected(Boolean(data.model_loaded));
          setAiError("");

          if (data.model_loaded) {
            setAiStatus("AI backend connected");
          }
        }
      } catch (error) {
        console.error("AI backend unavailable:", error);

        if (!cancelled) {
          setAiConnected(false);
          setAiError(
            "AI backend is not connected. Make sure FastAPI is running on port 8001."
          );
        }
      }
    }

    checkAIBackend();

    const interval = setInterval(
      checkAIBackend,
      10000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  /* ============================================================
     ATTACH VIDEO AFTER REACT RENDER
  ============================================================ */

  useEffect(() => {
    if (
      !isCameraOn ||
      !mediaStreamRef.current ||
      !videoRef.current
    ) {
      return;
    }

    const video = videoRef.current;

    video.srcObject = mediaStreamRef.current;

    video
      .play()
      .then(() => {
        console.log("Video playback started.");

        startPoseDetection();
      })
      .catch((error) => {
        console.error(
          "Video playback error:",
          error
        );

        setCameraError(
          "Could not start video playback."
        );
      });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current = null;
      }
    };
  }, [isCameraOn]);

  /* ============================================================
     RECORDING TIMER
  ============================================================ */

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const interval = setInterval(() => {
      setRecordingSeconds(
        (previous) => previous + 1
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  /* ============================================================
     INACTIVITY TIMER
  ============================================================ */

  useEffect(() => {
    if (!isCameraOn) {
      setInactivitySeconds(0);
      setInactivityStatus("Normal");
      return;
    }

    const interval = setInterval(() => {
      setInactivitySeconds((previous) => {
        const next = previous + 1;

        if (next >= 300) {
          setInactivityStatus("Attention");
        } else {
          setInactivityStatus("Normal");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCameraOn]);

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (error) {
          console.warn(
            "Could not close MediaPipe:",
            error
          );
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      recordings.forEach((recording) => {
        if (recording.url) {
          URL.revokeObjectURL(recording.url);
        }
      });
    };
  }, []);

  /* ============================================================
     CREATE MEDIAPIPE POSE
  ============================================================ */

  function createPose() {
    if (
      !window.Pose ||
      typeof window.Pose !== "function"
    ) {
      console.error(
        "MediaPipe Pose is not loaded."
      );

      setAiError(
        "MediaPipe Pose is still loading. Please wait a few seconds and try again."
      );

      return null;
    }

    const pose = new window.Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(processPoseResults);

    return pose;
  }

  /* ============================================================
     START POSE DETECTION
  ============================================================ */

  function startPoseDetection() {
    if (!videoRef.current) {
      console.warn(
        "Video element is not available."
      );
      return;
    }

    if (poseRef.current) {
      console.log(
        "MediaPipe Pose already running."
      );
      return;
    }

    const pose = createPose();

    if (!pose) {
      return;
    }

    poseRef.current = pose;

    setAiStatus("MediaPipe starting...");
    setAiError("");

    let stopped = false;

    const processFrame = async () => {
      if (
        stopped ||
        !mountedRef.current
      ) {
        return;
      }

      if (!videoRef.current) {
        animationFrameRef.current =
          requestAnimationFrame(
            processFrame
          );
        return;
      }

      const video = videoRef.current;

      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !poseProcessingRef.current
      ) {
        try {
          poseProcessingRef.current = true;

          await pose.send({
            image: video,
          });
        } catch (error) {
          console.error(
            "MediaPipe frame error:",
            error
          );
        } finally {
          poseProcessingRef.current = false;
        }
      }

      animationFrameRef.current =
        requestAnimationFrame(
          processFrame
        );
    };

    animationFrameRef.current =
      requestAnimationFrame(
        processFrame
      );
  }

  /* ============================================================
     PROCESS MEDIAPIPE RESULTS
  ============================================================ */

  function processPoseResults(results) {
    if (!mountedRef.current) {
      return;
    }

    if (
      !results ||
      !results.poseLandmarks
    ) {
      setAiStatus("Pose not detected");
      return;
    }

    const landmarks =
      results.poseLandmarks;

    if (
      !Array.isArray(landmarks) ||
      landmarks.length !== 33
    ) {
      console.warn(
        "Unexpected landmark count:",
        landmarks?.length
      );

      return;
    }

    const features = [];

    for (const landmark of landmarks) {
      features.push(
        landmark.x ?? 0,
        landmark.y ?? 0,
        landmark.z ?? 0,
        landmark.visibility ?? 0
      );
    }

    if (
      features.length !== FEATURE_COUNT
    ) {
      console.warn(
        `Expected ${FEATURE_COUNT} features but received ${features.length}`
      );

      return;
    }

    setPoseFrames(
      (previous) => previous + 1
    );

    sequenceRef.current.push(
      features
    );

    if (
      sequenceRef.current.length >
      SEQUENCE_LENGTH
    ) {
      sequenceRef.current.shift();
    }

    setSequenceFrames(
      sequenceRef.current.length
    );

    if (
      sequenceRef.current.length <
      SEQUENCE_LENGTH
    ) {
      setAiStatus(
        `Collecting pose data ${sequenceRef.current.length}/${SEQUENCE_LENGTH}`
      );

      return;
    }

    framesSincePredictionRef.current += 1;

    setAiStatus(
      "Pose detected • AI processing"
    );

    if (
      framesSincePredictionRef.current >=
      WINDOW_STEP
    ) {
      framesSincePredictionRef.current = 0;

      const sequence = [
        ...sequenceRef.current,
      ];

      sendSequenceToAI(sequence);
    }
  }

  /* ============================================================
     SEND SEQUENCE TO FASTAPI
  ============================================================ */

  async function sendSequenceToAI(sequence) {
    if (
      !sequence ||
      sequence.length !==
        SEQUENCE_LENGTH
    ) {
      return;
    }

    try {
      const response = await fetch(
        AI_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            landmarks: sequence,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `AI API returned ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "VitalCare AI prediction:",
        data
      );

      let probability = 0;

      if (
        typeof data.fall_probability ===
        "number"
      ) {
        probability =
          data.fall_probability;
      } else if (
        typeof data.fall_percentage ===
        "number"
      ) {
        probability =
          data.fall_percentage / 100;
      }

      const percentage = Math.max(
        0,
        Math.min(
          100,
          probability * 100
        )
      );

      setFallProbability(
        percentage
      );

      const predictedFall =
        data.prediction === "FALL" ||
        percentage >= FALL_THRESHOLD;

      setPrediction(
        predictedFall
          ? "FALL"
          : "NON-FALL"
      );

      /* --------------------------------------------------------
         Confirmation:
         65% + 3 consecutive high windows
      -------------------------------------------------------- */

      if (
        percentage >=
        FALL_THRESHOLD
      ) {
        highProbabilityWindowsRef.current +=
          1;
      } else {
        highProbabilityWindowsRef.current = 0;
      }

      const currentHighWindows =
        highProbabilityWindowsRef.current;

      setConsecutiveHighWindows(
        currentHighWindows
      );

      const backendConfirmed =
        data.fall_confirmed === true;

      const confirmed =
        backendConfirmed ||
        currentHighWindows >=
          REQUIRED_CONSECUTIVE_WINDOWS;

      setFallConfirmed(
        confirmed
      );

      if (confirmed) {
        setAiStatus(
          "🚨 FALL CONFIRMED"
        );
      } else if (predictedFall) {
        setAiStatus(
          "High fall probability"
        );
      } else {
        setAiStatus(
          "AI monitoring active"
        );
      }

      setAiConnected(true);
      setAiError("");
    } catch (error) {
      console.error(
        "AI prediction error:",
        error
      );

      setAiConnected(false);

      setAiStatus(
        "AI connection error"
      );

      setAiError(
        "Could not connect to VitalCare AI prediction service."
      );
    }
  }

  /* ============================================================
     START CAMERA
  ============================================================ */

  async function startCamera() {
    try {
      setCameraError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Your browser does not support webcam access."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
              facingMode: "user",
            },
            audio: true,
          }
        );

      mediaStreamRef.current =
        stream;

      resetAIState();

      setIsCameraOn(true);

      setCameras(
        (previous) =>
          previous.map((camera) =>
            camera.id ===
            selectedCameraId
              ? {
                  ...camera,
                  status: "Online",
                }
              : camera
          )
      );

      console.log(
        "Webcam opened successfully."
      );
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setCameraError(
        error?.message ||
          "Could not access the camera. Please allow camera permission."
      );

      setIsCameraOn(false);
    }
  }

  /* ============================================================
     STOP CAMERA
  ============================================================ */

  function stopCamera() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current =
        null;
    }

    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch (error) {
        console.warn(
          "Could not close MediaPipe:",
          error
        );
      }

      poseRef.current = null;
    }

    poseProcessingRef.current =
      false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setIsCameraOn(false);
    setIsRecording(false);
    setRecordingSeconds(0);

    setCameras(
      (previous) =>
        previous.map((camera) =>
          camera.id ===
          selectedCameraId
            ? {
                ...camera,
                status: "Offline",
              }
            : camera
        )
    );

    resetAIState();
  }

  /* ============================================================
     RESET AI
  ============================================================ */

  function resetAIState() {
    sequenceRef.current = [];

    framesSincePredictionRef.current = 0;

    highProbabilityWindowsRef.current = 0;

    setFallProbability(0);
    setPrediction("WAITING");
    setFallConfirmed(false);

    setConsecutiveHighWindows(0);

    setPoseFrames(0);
    setSequenceFrames(0);

    setAiStatus("Waiting");

    setInactivitySeconds(0);
    setInactivityStatus("Normal");
  }

  /* ============================================================
     START RECORDING
  ============================================================ */

  function startRecording() {
    if (!mediaStreamRef.current) {
      setCameraError(
        "Start the camera before recording."
      );

      return;
    }

    try {
      const chunks = [];

      let options = {};

      if (
        MediaRecorder.isTypeSupported(
          "video/webm"
        )
      ) {
        options = {
          mimeType: "video/webm",
        };
      }

      const recorder =
        new MediaRecorder(
          mediaStreamRef.current,
          options
        );

      mediaRecorderRef.current =
        recorder;

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            chunks.push(
              event.data
            );
          }
        };

      recorder.onstop = () => {
        const blob = new Blob(
          chunks,
          {
            type:
              recorder.mimeType ||
              "video/webm",
          }
        );

        const url =
          URL.createObjectURL(blob);

        const recording = {
          id: Date.now(),

          name: `Camera Recording ${new Date().toLocaleTimeString()}`,

          camera:
            selectedCamera?.name ||
            "Camera",

          duration:
            recordingSeconds,

          createdAt: new Date(),

          url,
        };

        setRecordings(
          (previous) => [
            recording,
            ...previous,
          ]
        );
      };

      recorder.start();

      setRecordingSeconds(0);
      setIsRecording(true);

      setCameras(
        (previous) =>
          previous.map((camera) =>
            camera.id ===
            selectedCameraId
              ? {
                  ...camera,
                  status: "Recording",
                }
              : camera
          )
      );
    } catch (error) {
      console.error(
        "Recording error:",
        error
      );

      setCameraError(
        "Recording could not be started in this browser."
      );
    }
  }

  /* ============================================================
     STOP RECORDING
  ============================================================ */

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current =
      null;

    setIsRecording(false);
    setRecordingSeconds(0);

    setCameras(
      (previous) =>
        previous.map((camera) =>
          camera.id ===
          selectedCameraId
            ? {
                ...camera,
                status: isCameraOn
                  ? "Online"
                  : "Offline",
              }
            : camera
        )
    );
  }

  /* ============================================================
     ADD CAMERA
  ============================================================ */

  function addCamera() {
    if (!newCameraName.trim()) {
      return;
    }

    const newCamera = {
      id: Date.now(),

      name:
        newCameraName.trim(),

      location:
        newCameraLocation.trim() ||
        "Not specified",

      status: "Offline",
    };

    setCameras(
      (previous) => [
        ...previous,
        newCamera,
      ]
    );

    setSelectedCameraId(
      newCamera.id
    );

    setNewCameraName("");
    setNewCameraLocation("");

    setShowAddCamera(false);
  }

  /* ============================================================
     DELETE CAMERA
  ============================================================ */

  function deleteCamera(id) {
    if (cameras.length <= 1) {
      return;
    }

    if (id === selectedCameraId) {
      stopCamera();

      const remaining =
        cameras.filter(
          (camera) =>
            camera.id !== id
        );

      setCameras(remaining);

      if (remaining.length > 0) {
        setSelectedCameraId(
          remaining[0].id
        );
      }
    } else {
      setCameras(
        (previous) =>
          previous.filter(
            (camera) =>
              camera.id !== id
          )
      );
    }
  }

  /* ============================================================
     SELECT CAMERA
  ============================================================ */

  function selectCamera(id) {
    if (id === selectedCameraId) {
      return;
    }

    if (isCameraOn) {
      stopCamera();
    }

    setSelectedCameraId(id);
    resetAIState();
  }

  /* ============================================================
     DELETE RECORDING
  ============================================================ */

  function deleteRecording(id) {
    const recording =
      recordings.find(
        (item) => item.id === id
      );

    if (
      recording?.url
    ) {
      URL.revokeObjectURL(
        recording.url
      );
    }

    setRecordings(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );

    if (
      selectedRecording?.id === id
    ) {
      setSelectedRecording(null);
    }
  }

  /* ============================================================
     AI COLOR
  ============================================================ */

  const probabilityClass =
    fallProbability >= 65
      ? "text-red-600"
      : fallProbability >= 40
      ? "text-orange-500"
      : "text-green-600";

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-3 text-white">
                <Camera size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Camera Monitoring
                </h1>

                <p className="text-sm text-slate-500">
                  AI-powered elder safety monitoring
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setShowAddCamera(true)
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Camera
          </button>
        </div>

        {/* CAMERA SELECTOR */}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              onClick={() =>
                selectCamera(camera.id)
              }
              className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition ${
                camera.id ===
                selectedCameraId
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {camera.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {camera.location}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                    camera.status
                  )}`}
                >
                  {camera.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {camera.status ===
                  "Offline" ? (
                    <WifiOff
                      size={16}
                    />
                  ) : (
                    <Wifi
                      size={16}
                    />
                  )}

                  Camera {camera.id}
                </div>

                {cameras.length >
                  1 && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteCamera(
                        camera.id
                      );
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ERROR */}

        {cameraError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle
              size={20}
            />

            <span>{cameraError}</span>
          </div>
        )}

        {/* MAIN CONTENT */}

        <div className="grid gap-6 xl:grid-cols-3">
          {/* VIDEO */}

          <div className="xl:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {selectedCamera?.name ||
                      "Camera"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {selectedCamera?.location ||
                      ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isRecording && (
                    <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                      <Circle
                        size={9}
                        fill="currentColor"
                      />
                      Recording{" "}
                      {formatTime(
                        recordingSeconds
                      )}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isCameraOn
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isCameraOn
                      ? "Live"
                      : "Offline"}
                  </span>
                </div>
              </div>

              {/* VIDEO ELEMENT IS ALWAYS RENDERED */}
              <div className="relative aspect-video bg-slate-950">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-full w-full object-cover ${
                    isCameraOn
                      ? "block"
                      : "hidden"
                  }`}
                />

                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <CameraOff
                      size={48}
                      className="mb-3"
                    />

                    <p className="font-semibold">
                      Camera is offline
                    </p>

                    <p className="mt-1 text-sm">
                      Start the camera to begin monitoring
                    </p>
                  </div>
                )}

                {isCameraOn && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    LIVE
                  </div>
                )}

                {isCameraOn && (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
                    {!isRecording ? (
                      <button
                        onClick={
                          startRecording
                        }
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-red-700"
                      >
                        <Circle
                          size={17}
                          fill="currentColor"
                        />
                        Record
                      </button>
                    ) : (
                      <button
                        onClick={
                          stopRecording
                        }
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-red-600 shadow-lg transition hover:bg-slate-100"
                      >
                        <Square
                          size={16}
                          fill="currentColor"
                        />
                        Stop Recording
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 p-5">
                {!isCameraOn ? (
                  <button
                    onClick={
                      startCamera
                    }
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Play size={18} />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={
                      stopCamera
                    }
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    <CameraOff
                      size={18}
                    />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI PANEL */}

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                    <Brain
                      size={22}
                    />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      AI Fall Detection
                    </h2>

                    <p className="text-xs text-slate-500">
                      MediaPipe + VitalCare AI
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    aiConnected
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      aiConnected
                        ? "bg-green-500"
                        : "bg-slate-300"
                    }`}
                  />

                  {aiConnected
                    ? "Connected"
                    : "Offline"}
                </div>
              </div>

              <div className="mb-5 rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Fall Probability
                </p>

                <p
                  className={`mt-1 text-4xl font-bold ${probabilityClass}`}
                >
                  {fallProbability.toFixed(
                    2
                  )}
                  %
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fallProbability >=
                      65
                        ? "bg-red-500"
                        : fallProbability >=
                          40
                        ? "bg-orange-400"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        fallProbability,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">
                    Prediction
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      prediction ===
                      "FALL"
                        ? "text-red-600"
                        : prediction ===
                          "NON-FALL"
                        ? "text-green-600"
                        : "text-slate-600"
                    }`}
                  >
                    {prediction}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">
                    Confirmed
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      fallConfirmed
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {fallConfirmed
                      ? "YES"
                      : "NO"}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    High Probability Windows
                  </p>

                  <p className="font-bold text-slate-800">
                    {
                      consecutiveHighWindows
                    }
                    /
                    {
                      REQUIRED_CONSECUTIVE_WINDOWS
                    }
                  </p>
                </div>

                <div className="mt-2 flex gap-1">
                  {Array.from({
                    length:
                      REQUIRED_CONSECUTIVE_WINDOWS,
                  }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full ${
                          index <
                          consecutiveHighWindows
                            ? "bg-red-500"
                            : "bg-slate-200"
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div
                className={`mt-4 rounded-xl p-3 text-sm font-medium ${
                  fallConfirmed
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-50 text-slate-600"
                }`}
              >
                {aiStatus}
              </div>

              {aiError && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">
                  {aiError}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">
                    Pose Frames
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {poseFrames}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">
                    Sequence
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {sequenceFrames}/
                    {SEQUENCE_LENGTH}
                  </p>
                </div>
              </div>
            </div>

            {/* INACTIVITY */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                  <Clock
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Inactivity Monitoring
                  </h2>

                  <p className="text-xs text-slate-500">
                    Automatic activity tracking
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      inactivityStatus ===
                      "Attention"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {inactivityStatus}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Timer
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {formatTime(
                      inactivitySeconds
                    )}
                  </p>
                </div>
              </div>

              {inactivityStatus ===
                "Attention" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
                  <AlertTriangle
                    size={17}
                  />
                  No activity detected for 5 minutes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECORDING HISTORY */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Video size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Recording History
              </h2>

              <p className="text-xs text-slate-500">
                Recorded camera sessions
              </p>
            </div>
          </div>

          {recordings.length ===
          0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <Video
                size={42}
                className="text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-600">
                No recordings yet
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Start recording from the live camera view.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recordings.map(
                (recording) => (
                  <div
                    key={recording.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                        <Video
                          size={20}
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {recording.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {recording.camera}{" "}
                          •{" "}
                          {formatTime(
                            recording.duration
                          )}{" "}
                          •{" "}
                          {recording.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSelectedRecording(
                            recording
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        <Play
                          size={16}
                        />
                        View
                      </button>

                      <button
                        onClick={() =>
                          deleteRecording(
                            recording.id
                          )
                        }
                        className="rounded-xl p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2
                          size={17}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* SAFETY INFO */}

        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
          <ShieldCheck
            size={24}
            className="mt-0.5 shrink-0 text-green-600"
          />

          <div>
            <h3 className="font-bold text-green-800">
              VitalCare AI Safety Monitoring
            </h3>

            <p className="mt-1 text-sm leading-6 text-green-700">
              Fall detection uses 30-frame pose
              sequences and a 65% probability
              threshold. A fall is confirmed after
              3 consecutive high-probability
              windows or when the AI backend
              confirms the event.
            </p>
          </div>
        </div>
      </div>

      {/* ADD CAMERA MODAL */}

      {showAddCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Camera
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new monitoring camera.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddCamera(false)
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Camera Name
                </label>

                <input
                  value={newCameraName}
                  onChange={(event) =>
                    setNewCameraName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Bedroom Camera"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>

                <input
                  value={
                    newCameraLocation
                  }
                  onChange={(event) =>
                    setNewCameraLocation(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Elder's Bedroom"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    setShowAddCamera(false)
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={addCamera}
                  disabled={
                    !newCameraName.trim()
                  }
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add Camera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORDING MODAL */}

      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  {selectedRecording.name}
                </h2>

                <p className="text-xs text-slate-500">
                  {selectedRecording.camera}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedRecording(null)
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-black">
              <video
                src={selectedRecording.url}
                controls
                autoPlay
                className="max-h-[70vh] w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}