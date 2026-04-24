# # from fastapi import FastAPI
# # from fastapi.middleware.cors import CORSMiddleware

# # from api.detect import router as detect_router

# # app = FastAPI()

# # # Enable CORS (important for frontend later)
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # Include routes
# # app.include_router(detect_router)


# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from api.detect import router as detect_router
# from api.reports import router as reports_router

# from db.session import engine
# from db.models import Base

# app = FastAPI()

# # Create tables
# Base.metadata.create_all(bind=engine)

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Routes
# app.include_router(detect_router)
# app.include_router(reports_router)

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.detect import router as detect_router
from api.reports import router as reports_router
from db.session import engine
from db.models import Base


# ─────────────────────────────────────────
# Lifespan: load models ONCE on startup
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load all ML models so the first request is not slow."""
    print("🔄  Loading ML models…")
    # Importing triggers module-level singleton instantiation
    from api.detect import image_detector, video_detector, audio_detector  # noqa: F401
    print("✅  All models loaded and ready.")
    yield
    print("🛑  Shutting down.")


# ─────────────────────────────────────────
# App
# ─────────────────────────────────────────
app = FastAPI(
    title="TruthLens API",
    description="Deepfake detection for images, video, and audio.",
    version="1.0.0",
    lifespan=lifespan,
)

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────
# CORS — fully open during hackathon dev
# ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Global file-size guard (200 MB ceiling)
# Per-type limits are also enforced in each route.
# ─────────────────────────────────────────
MAX_UPLOAD_BYTES = 200 * 1024 * 1024  # 200 MB


@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_UPLOAD_BYTES:
            return JSONResponse(
                status_code=422,
                content={"detail": "File too large. Maximum allowed size is 200 MB."},
            )
    return await call_next(request)


# ─────────────────────────────────────────
# Routers
# ─────────────────────────────────────────
app.include_router(detect_router)
app.include_router(reports_router)


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "service": "TruthLens API v1.0.0"}
