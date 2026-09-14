import cv2
import mediapipe as mp
import requests
from collections import deque


TENSORFLOW_API = "http://127.0.0.1:8001/predict"

SEQUENCE_LENGTH = 30
FEATURE_COUNT = 132

# V2 model was trained using a 15-frame window step
WINDOW_STEP = 15


class PoseExtractor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose

        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
        )

        print("MediaPipe Pose service initialized.")

    def extract_landmarks(self, frame):
        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB,
        )

        results = self.pose.process(rgb_frame)

        if not results.pose_landmarks:
            return None

        landmarks = []

        for landmark in results.pose_landmarks.landmark:
            landmarks.extend([
                landmark.x,
                landmark.y,
                landmark.z,
                landmark.visibility,
            ])

        if len(landmarks) != FEATURE_COUNT:
            return None

        return landmarks

    def close(self):
        self.pose.close()


def send_to_tensorflow(sequence):
    try:
        response = requests.post(
            TENSORFLOW_API,
            json={
                "landmarks": sequence
            },
            timeout=30,
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as error:
        print(
            f"TensorFlow API error: {error}"
        )

        return None


def main():
    extractor = PoseExtractor()

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Could not open webcam.")
        extractor.close()
        return

    print("Webcam opened successfully.")
    print(
        "Collecting 30 frames for fall prediction..."
    )
    print(
        "Prediction window: 30 frames"
    )
    print(
        "Window step: 15 frames"
    )
    print("Press Q to quit.")

    sequence = deque(
        maxlen=SEQUENCE_LENGTH
    )

    frames_since_prediction = 0

    last_prediction = None

    while True:

        success, frame = camera.read()

        if not success:
            print(
                "ERROR: Could not read webcam frame."
            )
            break

        landmarks = extractor.extract_landmarks(
            frame
        )

        if landmarks is not None:

            sequence.append(landmarks)

            print(
                f"Pose detected: "
                f"{len(landmarks)} features | "
                f"Frames: "
                f"{len(sequence)}/{SEQUENCE_LENGTH}"
            )

        else:

            print("No pose detected.")

        # Once we have 30 frames, start prediction
        if len(sequence) == SEQUENCE_LENGTH:

            frames_since_prediction += 1

            # Send prediction every 15 new frames
            if frames_since_prediction >= WINDOW_STEP:

                prediction = send_to_tensorflow(
                    list(sequence)
                )

                frames_since_prediction = 0

                if prediction is not None:

                    last_prediction = prediction

                    print()

                    print(
                        "========== FALL PREDICTION =========="
                    )

                    print(
                        f"Probability: "
                        f"{prediction['fall_percentage']}%"
                    )

                    print(
                        f"Prediction: "
                        f"{prediction['prediction']}"
                    )

                    print(
                        f"Threshold: "
                        f"{prediction['threshold'] * 100}%"
                    )

                    print(
                        f"Consecutive high windows: "
                        f"{prediction['consecutive_high_windows']}/"
                        f"{prediction['required_consecutive_windows']}"
                    )

                    print(
                        f"Fall confirmed: "
                        f"{prediction['fall_confirmed']}"
                    )

                    print(
                        "====================================="
                    )

                    print()

        # Display prediction on webcam
        if last_prediction is not None:

            text = (
                f"{last_prediction['prediction']} "
                f"{last_prediction['fall_percentage']}%"
            )

            if last_prediction["fall_confirmed"]:

                text += " | FALL CONFIRMED"

            display_color = (
                (0, 0, 255)
                if last_prediction["fall_confirmed"]
                else (
                    (0, 0, 255)
                    if last_prediction["prediction"] == "FALL"
                    else (0, 255, 0)
                )
            )

            cv2.putText(
                frame,
                text,
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                display_color,
                2,
            )

        cv2.imshow(
            "VitalCare AI Fall Detection",
            frame,
        )

        if cv2.waitKey(1) & 0xFF == ord("q"):

            break

    camera.release()

    cv2.destroyAllWindows()

    extractor.close()

    print(
        "VitalCare fall detection stopped."
    )


if __name__ == "__main__":

    main()