import os
import cv2
import numpy as np
import tensorflow as tf
import mediapipe as mp


MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "vitalcare_fall_v2_best.keras",
)

SEQUENCE_LENGTH = 30
LANDMARK_COUNT = 33
FEATURES_PER_LANDMARK = 4


class FallDetector:
    def __init__(self):
        print("Loading VitalCare fall detection model...")

        self.model = tf.keras.models.load_model(MODEL_PATH)

        # New MediaPipe Tasks API
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        self.vision = vision
        self.python = python

        model_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "pose_landmarker_lite.task",
        )

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"MediaPipe pose model not found: {model_path}"
            )

        base_options = python.BaseOptions(
            model_asset_path=model_path
        )

        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self.pose_landmarker = vision.PoseLandmarker.create_from_options(
            options
        )

        print("Fall detection model loaded successfully.")

    def extract_landmarks(self, frame):
        """
        Extract 33 MediaPipe pose landmarks.

        Each landmark:
        x, y, z, visibility

        Total:
        33 × 4 = 132 features
        """

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = self.vision.Image(
            image_format=self.vision.ImageFormat.SRGB,
            data=rgb_frame,
        )

        result = self.pose_landmarker.detect(mp_image)

        if not result.pose_landmarks:
            return None

        landmarks = []

        for landmark in result.pose_landmarks[0]:
            landmarks.extend(
                [
                    landmark.x,
                    landmark.y,
                    landmark.z,
                    landmark.visibility,
                ]
            )

        if len(landmarks) != LANDMARK_COUNT * FEATURES_PER_LANDMARK:
            return None

        return np.array(landmarks, dtype=np.float32)

    def predict_sequence(self, frames):
        """
        Predict fall probability from exactly 30 frames.
        """

        if len(frames) != SEQUENCE_LENGTH:
            raise ValueError(
                f"Expected {SEQUENCE_LENGTH} frames, "
                f"but received {len(frames)}."
            )

        sequence = []

        for frame in frames:
            landmarks = self.extract_landmarks(frame)

            if landmarks is None:
                landmarks = np.zeros(
                    LANDMARK_COUNT * FEATURES_PER_LANDMARK,
                    dtype=np.float32,
                )

            sequence.append(landmarks)

        sequence = np.array(sequence, dtype=np.float32)

        # (30, 132)
        # ↓
        # (1, 30, 132)

        model_input = np.expand_dims(sequence, axis=0)

        probability = float(
            self.model.predict(
                model_input,
                verbose=0
            )[0][0]
        )

        return {
            "fall_probability": probability,
            "fall_percentage": round(probability * 100, 2),
            "prediction": (
                "FALL"
                if probability >= 0.65
                else "NO_FALL"
            ),
        }