import cv2
import mediapipe as mp
import requests
from collections import deque


VIDEO_PATH = "urfd_fall_test.mp4"
TENSORFLOW_API = "http://127.0.0.1:8001/predict"

SEQUENCE_LENGTH = 30
FEATURE_COUNT = 132
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

        print("MediaPipe Pose initialized.")

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
        print(f"TensorFlow API error: {error}")
        return None


def main():

    extractor = PoseExtractor()

    video = cv2.VideoCapture(VIDEO_PATH)

    if not video.isOpened():
        print("ERROR: Could not open video.")
        extractor.close()
        return

    total_frames = int(
        video.get(cv2.CAP_PROP_FRAME_COUNT)
    )

    fps = video.get(cv2.CAP_PROP_FPS)

    print()
    print("======================================")
    print("VitalCare Fall Video Test")
    print("======================================")
    print(f"Video: {VIDEO_PATH}")
    print(f"Total frames: {total_frames}")
    print(f"FPS: {fps:.2f}")
    print(f"Window size: {SEQUENCE_LENGTH}")
    print(f"Window step: {WINDOW_STEP}")
    print("======================================")
    print()

    sequence = deque(
        maxlen=SEQUENCE_LENGTH
    )

    frame_number = 0
    frames_since_prediction = 0

    predictions = []

    fall_confirmed_anywhere = False

    while True:

        success, frame = video.read()

        if not success:
            break

        frame_number += 1

        landmarks = extractor.extract_landmarks(
            frame
        )

        if landmarks is not None:

            sequence.append(landmarks)

            print(
                f"Frame {frame_number}/{total_frames} "
                f"| Pose detected "
                f"| Sequence: "
                f"{len(sequence)}/{SEQUENCE_LENGTH}"
            )

        else:

            print(
                f"Frame {frame_number}/{total_frames} "
                f"| No pose detected"
            )

        if len(sequence) == SEQUENCE_LENGTH:

            frames_since_prediction += 1

            if frames_since_prediction >= WINDOW_STEP:

                start_frame = (
                    frame_number - SEQUENCE_LENGTH + 1
                )

                end_frame = frame_number

                print()
                print(
                    f"Predicting window "
                    f"{start_frame}-{end_frame}..."
                )

                prediction = send_to_tensorflow(
                    list(sequence)
                )

                frames_since_prediction = 0

                if prediction is not None:

                    predictions.append(
                        prediction
                    )

                    print(
                        f"Fall probability: "
                        f"{prediction['fall_percentage']}%"
                    )

                    print(
                        f"Prediction: "
                        f"{prediction['prediction']}"
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

                    if prediction["fall_confirmed"]:
                        fall_confirmed_anywhere = True

                    print()

    video.release()
    extractor.close()

    print()
    print("======================================")
    print("FINAL RESULT")
    print("======================================")

    if not predictions:

        print("No predictions were generated.")

    else:

        best_prediction = max(
            predictions,
            key=lambda x: x["fall_probability"]
        )

        print(
            f"Number of predictions: "
            f"{len(predictions)}"
        )

        print(
            f"Highest fall probability: "
            f"{best_prediction['fall_percentage']}%"
        )

        print(
            f"Best prediction: "
            f"{best_prediction['prediction']}"
        )

        print(
            f"Fall confirmed: "
            f"{fall_confirmed_anywhere}"
        )

        if fall_confirmed_anywhere:

            print()
            print(
                "🚨 FALL CONFIRMED BY VITALCARE AI"
            )

        else:

            print()
            print(
                "No fall was confirmed."
            )

    print("======================================")


if __name__ == "__main__":
    main()