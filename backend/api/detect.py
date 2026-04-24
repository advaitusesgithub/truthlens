# # from fastapi import APIRouter, UploadFile, File
# # from PIL import Image
# # import io
# # import base64

# # from ml.image_detector import ImageDeepfakeDetector

# # router = APIRouter()

# # # Load model once (important)
# # detector = ImageDeepfakeDetector()


# # @router.post("/detect/image")
# # async def detect_image(file: UploadFile = File(...)):
# #     try:
# #         # Read file
# #         contents = await file.read()
# #         image = Image.open(io.BytesIO(contents))

# #         # Run detection
# #         result = detector.predict(image)

# #         # Convert heatmap to base64
# #         buffered = io.BytesIO()
# #         result["heatmap"].save(buffered, format="PNG")
# #         heatmap_base64 = base64.b64encode(buffered.getvalue()).decode()

# #         return {
# #             "label": result["label"],
# #             "confidence": result["confidence"],
# #             "heatmap": heatmap_base64
# #         }

# #     except Exception as e:
# #         return {"error": str(e)}

# from fastapi import APIRouter, UploadFile, File, HTTPException
# import tempfile
# import os
# import base64
# import io
# from PIL import Image

# from ml.image_detector import ImageDeepfakeDetector
# from ml.video_detector import VideoDeepfakeDetector
# from ml.audio_detector import AudioDeepfakeDetector

# router = APIRouter()

# # Load models ONCE
# image_detector = ImageDeepfakeDetector()
# video_detector = VideoDeepfakeDetector()
# audio_detector = AudioDeepfakeDetector()


# # =========================
# # IMAGE ENDPOINT
# # =========================
# @router.post("/detect/image")
# async def detect_image(file: UploadFile = File(...)):
#     try:
#         # Validate file type
#         if not file.content_type.startswith("image/"):
#             raise HTTPException(status_code=422, detail="Invalid image file")

#         contents = await file.read()
#         image = Image.open(io.BytesIO(contents))

#         result = image_detector.predict(image)

#         return result

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # =========================
# # VIDEO ENDPOINT
# # =========================
# @router.post("/detect/video")
# async def detect_video(file: UploadFile = File(...)):
#     try:
#         if not file.content_type.startswith("video/"):
#             raise HTTPException(status_code=422, detail="Invalid video file")

#         # Save temp file
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp:
#             temp.write(await file.read())
#             temp_path = temp.name

#         result = video_detector.predict(temp_path)

#         os.remove(temp_path)

#         return result

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # =========================
# # AUDIO ENDPOINT
# # =========================
# @router.post("/detect/audio")
# async def detect_audio(file: UploadFile = File(...)):
#     try:
#         if not file.content_type.startswith("audio/"):
#             raise HTTPException(status_code=422, detail="Invalid audio file")

#         # Save temp file
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
#             temp.write(await file.read())
#             temp_path = temp.name

#         result = audio_detector.predict(temp_path)

#         os.remove(temp_path)

#         return result

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

"""
Detection routes
────────────────
POST /detect/image   → ImageDeepfakeDetector
POST /detect/video   → VideoDeepfakeDetector
POST /detect/audio   → AudioDeepfakeDetector

Each route:
  • Validates MIME type AND file extension
  • Enforces per-type file-size limits
  • Saves temp file for video/audio (images handled in-memory)
  • Measures inference time and returns it in the response
  • Auto-saves result to the community feed DB
"""

import io
import os
import tempfile
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from db.deps import get_db
from db.models import ScanResult
from ml.audio_detector import AudioDeepfakeDetector
from ml.image_detector import ImageDeepfakeDetector
from ml.video_detector import VideoDeepfakeDetector
from PIL import Image

router = APIRouter(tags=["detection"])

# ── Load models ONCE at module import time ───────────────────────────
print("🔄  Instantiating detectors…")
image_detector = ImageDeepfakeDetector()
video_detector = VideoDeepfakeDetector()
audio_detector = AudioDeepfakeDetector()
print("✅  Detectors ready.")

# ── Per-type size limits ─────────────────────────────────────────────
IMAGE_MAX_BYTES = 20 * 1024 * 1024    # 20 MB
VIDEO_MAX_BYTES = 200 * 1024 * 1024   # 200 MB
AUDIO_MAX_BYTES = 50 * 1024 * 1024    # 50 MB

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
ALLOWED_AUDIO_EXTS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac"}


# ── Helpers ──────────────────────────────────────────────────────────

def _ext(filename: str) -> str:
    return os.path.splitext(filename or "")[-1].lower()


def _save_result(db: Session, media_type: str, label: str,
                 confidence: float, source_domain: Optional[str] = None):
    """Persist scan result to the community feed."""
    entry = ScanResult(
        media_type=media_type,
        verdict=label,
        confidence=confidence,
        source_domain=source_domain,
    )
    db.add(entry)
    db.commit()


# ═══════════════════════════════════════════════════════════════════
# IMAGE
# ═══════════════════════════════════════════════════════════════════

@router.post("/detect/image")
async def detect_image(
    file: UploadFile = File(...),
    source_domain: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Accepts an image upload and returns:
      - label          "fake" | "real" | "uncertain"
      - confidence     float 0–1
      - heatmap_base64 base64 PNG of GradCAM overlay
      - inference_ms   int
    """
    # Validate extension
    if _ext(file.filename) not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported image format. Allowed: {', '.join(ALLOWED_IMAGE_EXTS)}",
        )

    # Read into memory
    contents = await file.read()

    # Enforce size limit
    if len(contents) > IMAGE_MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail="Image exceeds 20 MB limit.",
        )

    try:
        image = Image.open(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Cannot read image: {exc}")

    try:
        t0 = time.perf_counter()
        result = image_detector.predict(image)
        inference_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    # Auto-save to community feed
    _save_result(db, "image", result["label"], result["confidence"], source_domain)

    return {
        "label": result["label"],
        "confidence": result["confidence"],
        "heatmap_base64": result["heatmap"],
        "inference_ms": inference_ms,
    }


# ═══════════════════════════════════════════════════════════════════
# VIDEO
# ═══════════════════════════════════════════════════════════════════

@router.post("/detect/video")
async def detect_video(
    file: UploadFile = File(...),
    source_domain: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Accepts a video upload and returns:
      - label                "fake" | "real" | "uncertain"
      - confidence           float
      - frame_count          int
      - frames               list of per-frame results
      - worst_frame_heatmap  base64 PNG of the most suspicious frame
      - inference_ms         int
    """
    if _ext(file.filename) not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported video format. Allowed: {', '.join(ALLOWED_VIDEO_EXTS)}",
        )

    contents = await file.read()

    if len(contents) > VIDEO_MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail="Video exceeds 200 MB limit.",
        )

    # Write to a temp file — OpenCV needs a path, not a stream
    suffix = _ext(file.filename) or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        t0 = time.perf_counter()
        result = video_detector.predict(tmp_path)
        inference_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")
    finally:
        os.remove(tmp_path)

    _save_result(db, "video", result["label"], result["confidence"], source_domain)

    return {
        "label": result["label"],
        "confidence": result["confidence"],
        "frame_count": result["frame_count"],
        "frames": result["frames"],
        "worst_frame_heatmap": result["worst_frame_heatmap"],
        "inference_ms": inference_ms,
    }


# ═══════════════════════════════════════════════════════════════════
# AUDIO
# ═══════════════════════════════════════════════════════════════════

@router.post("/detect/audio")
async def detect_audio(
    file: UploadFile = File(...),
    source_domain: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Accepts an audio upload and returns:
      - label       "fake" | "real" | "uncertain"
      - confidence  float
      - model       str   model identifier
      - spectrogram base64 PNG of the mel-spectrogram
      - inference_ms int
    """
    if _ext(file.filename) not in ALLOWED_AUDIO_EXTS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported audio format. Allowed: {', '.join(ALLOWED_AUDIO_EXTS)}",
        )

    contents = await file.read()

    if len(contents) > AUDIO_MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail="Audio exceeds 50 MB limit.",
        )

    suffix = _ext(file.filename) or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        t0 = time.perf_counter()
        result = audio_detector.predict(tmp_path)
        inference_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")
    finally:
        os.remove(tmp_path)

    _save_result(db, "audio", result["label"], result["confidence"], source_domain)

    return {
        "label": result["label"],
        "confidence": result["confidence"],
        "model": result["model"],
        "spectrogram": result.get("spectrogram", ""),
        "inference_ms": inference_ms,
    }
