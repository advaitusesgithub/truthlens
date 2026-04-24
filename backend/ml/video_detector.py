# import cv2
# import numpy as np

# from ml.image_detector import ImageDeepfakeDetector


# class VideoDeepfakeDetector:
#     def __init__(self):
#         self.image_detector = ImageDeepfakeDetector()

#     def predict(self, video_path: str):
#         cap = cv2.VideoCapture(video_path)

#         frame_results = []
#         frame_count = 0

#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 break

#             # Take every 10th frame
#             if frame_count % 10 == 0:
#                 # Convert BGR → RGB
#                 frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

#                 from PIL import Image
#                 image = Image.fromarray(frame_rgb)

#                 result = self.image_detector.predict(image)

#                 frame_results.append({
#                     "frame": frame_count,
#                     "confidence": result["confidence"],
#                     "label": result["label"],
#                     "heatmap": result["heatmap"]
#                 })

#             frame_count += 1

#         cap.release()

#         # Aggregate result
#         fake_count = sum(1 for f in frame_results if f["label"] == "fake")
#         real_count = len(frame_results) - fake_count

#         final_label = "fake" if fake_count > real_count else "real"

#         avg_confidence = np.mean([f["confidence"] for f in frame_results]) if frame_results else 0

#         return {
#             "label": final_label,
#             "confidence": float(avg_confidence),
#             "frames": frame_results
#         }


"""
VideoDeepfakeDetector
─────────────────────
Wraps ImageDeepfakeDetector to process video files frame-by-frame.
Extracts every N-th frame via OpenCV, runs image detection on each,
and returns a majority-vote verdict plus per-frame details.
"""

import os
from typing import List

import cv2
import numpy as np
from PIL import Image

from ml.image_detector import ImageDeepfakeDetector

# Sample every FRAME_STRIDE-th frame
FRAME_STRIDE = 10
# Cap at this many frames to keep response time reasonable
MAX_FRAMES = 30


class VideoDeepfakeDetector:
    """Singleton-friendly. Instantiate once at module level."""

    def __init__(self):
        print("   [VideoDetector] initialising (shares ImageDetector)…")
        self.image_detector = ImageDeepfakeDetector()
        print("   [VideoDetector] ready ✓")

    def predict(self, video_path: str) -> dict:
        """
        Returns:
            {
                "label":       "fake" | "real" | "uncertain",
                "confidence":  float,   # average across sampled frames
                "frame_count": int,     # total frames analysed
                "frames": [
                    {
                        "index":         int,
                        "timestamp_sec": float,
                        "label":         str,
                        "confidence":    float,
                        "heatmap":       str,   # base64 PNG of worst frame only
                    },
                    ...
                ],
                "worst_frame_heatmap": str,   # heatmap of highest-confidence fake frame
            }
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_results: List[dict] = []
        frame_index = 0
        frames_analysed = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_index % FRAME_STRIDE == 0 and frames_analysed < MAX_FRAMES:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)
                result = self.image_detector.predict(pil_image)
                timestamp_sec = round(frame_index / fps, 2)

                frame_results.append({
                    "index": frame_index,
                    "timestamp_sec": timestamp_sec,
                    "label": result["label"],
                    "confidence": result["confidence"],
                    "fake_prob": result.get("fake_prob", result["confidence"]),
                    # store heatmap per frame; we'll trim to worst later
                    "_heatmap": result["heatmap"],
                })
                frames_analysed += 1

            frame_index += 1

        cap.release()

        if not frame_results:
            return {
                "label": "uncertain",
                "confidence": 0.0,
                "frame_count": 0,
                "frames": [],
                "worst_frame_heatmap": "",
            }

        # ── Aggregate ──────────────────────────────────────────────
        fake_frames = [f for f in frame_results if f["label"] == "fake"]
        real_frames = [f for f in frame_results if f["label"] == "real"]

        if len(fake_frames) > len(real_frames):
            final_label = "fake"
        elif len(real_frames) > len(fake_frames):
            final_label = "real"
        else:
            final_label = "uncertain"

        avg_confidence = float(np.mean([f["confidence"] for f in frame_results]))

        # Worst frame = highest fake_prob
        worst_frame = max(frame_results, key=lambda f: f["fake_prob"])
        worst_heatmap = worst_frame["_heatmap"]

        # Strip internal fields from public output
        public_frames = [
            {
                "index": f["index"],
                "timestamp_sec": f["timestamp_sec"],
                "label": f["label"],
                "confidence": f["confidence"],
                # Include heatmap for every frame so VideoTimeline can show them
                "heatmap": f["_heatmap"],
            }
            for f in frame_results
        ]

        return {
            "label": final_label,
            "confidence": round(avg_confidence, 4),
            "frame_count": len(frame_results),
            "frames": public_frames,
            "worst_frame_heatmap": worst_heatmap,
        }
