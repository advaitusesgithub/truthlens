# import librosa
# import numpy as np
# import torch
# import torchvision.transforms as transforms
# from PIL import Image
# from torchvision import models


# class AudioDeepfakeDetector:
#     def __init__(self):
#         self.model = models.resnet18(pretrained=True)
#         self.model.eval()

#         self.transform = transforms.Compose([
#             transforms.Resize((224, 224)),
#             transforms.ToTensor()
#         ])

#     def audio_to_spectrogram(self, path):
#         y, sr = librosa.load(path, sr=None)

#         mel = librosa.feature.melspectrogram(
#             y=y,
#             sr=sr,
#             n_mels=128,
#             hop_length=512
#         )

#         mel_db = librosa.power_to_db(mel, ref=np.max)

#         # Normalize 0–1
#         mel_db = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min())

#         # Convert to image
#         img = Image.fromarray((mel_db * 255).astype(np.uint8))

#         # Convert to 3-channel
#         img = img.convert("RGB")

#         return img

#     def predict(self, audio_path):
#         image = self.audio_to_spectrogram(audio_path)

#         tensor = self.transform(image).unsqueeze(0)

#         with torch.no_grad():
#             output = self.model(tensor)

#         probs = torch.nn.functional.softmax(output, dim=1)
#         confidence, _ = torch.max(probs, dim=1)

#         if confidence.item() > 0.7:
#             label = "real"
#         elif confidence.item() < 0.3:
#             label = "fake"
#         else:
#             label = "uncertain"

#         return {
#             "label": label,
#             "confidence": float(confidence.item())
#         }

"""
AudioDeepfakeDetector
─────────────────────
Converts audio to a mel-spectrogram image and classifies it with a
ResNet18 whose final FC layer is replaced with a 2-class head.

Why spectrogram → image?
  AI-generated voices leave characteristic artefacts in the frequency
  domain that are clearly visible in a mel-spectrogram. A CNN trained
  (or fine-tuned) on genuine vs. AI-generated spectrograms can
  distinguish them reliably.

WEIGHTS
  Set the env var TRUTHLENS_AUDIO_WEIGHTS to a .pth path to load
  fine-tuned weights (e.g. ASVspoof2019 fine-tuned ResNet18).
  Without weights the model uses ImageNet init with a random 2-class
  head — predictions will be random but the pipeline will run correctly.
"""

import base64
import io
import os

import librosa
import librosa.display
import matplotlib
matplotlib.use("Agg")           # headless — no display needed
import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
from torchvision import models

WEIGHTS_PATH = os.environ.get("TRUTHLENS_AUDIO_WEIGHTS", "")

FAKE_THRESHOLD = 0.55
REAL_THRESHOLD = 0.45

# Mel-spectrogram params
N_MELS = 128
HOP_LENGTH = 512
TARGET_SR = 22050   # resample all audio to this rate


class AudioDeepfakeDetector:
    """Singleton-friendly. Instantiate once at module level."""

    def __init__(self):
        print("   [AudioDetector] loading ResNet18…")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # ResNet18 backbone
        self.model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

        # Replace final FC with 2-class head (real=0, fake=1)
        in_features = self.model.fc.in_features
        self.model.fc = nn.Linear(in_features, 2)

        # Load fine-tuned weights if available
        if WEIGHTS_PATH and os.path.isfile(WEIGHTS_PATH):
            state = torch.load(WEIGHTS_PATH, map_location=self.device)
            if "state_dict" in state:
                state = state["state_dict"]
            self.model.load_state_dict(state, strict=False)
            print(f"   [AudioDetector] loaded weights from {WEIGHTS_PATH}")
        else:
            print("   [AudioDetector] no fine-tuned weights — using ImageNet baseline")

        self.model.to(self.device)
        self.model.eval()

        # Preprocessing (same ImageNet stats — image-based model)
        self.transform = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225]),
        ])

        print("   [AudioDetector] ready ✓")

    # ──────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────

    def predict(self, audio_path: str) -> dict:
        """
        Returns:
            {
                "label":      "fake" | "real" | "uncertain",
                "confidence": float,
                "model":      "audio_cnn_v1",
                "spectrogram": str,   # base64 PNG of the mel-spectrogram
            }
        """
        pil_spec, spec_b64 = self._audio_to_spectrogram_image(audio_path)

        tensor = self.transform(pil_spec).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)

        probs = torch.softmax(logits, dim=1)
        fake_prob = probs[0, 1].item()
        real_prob = probs[0, 0].item()

        if fake_prob >= FAKE_THRESHOLD:
            label = "fake"
            confidence = fake_prob
        elif real_prob >= REAL_THRESHOLD:
            label = "real"
            confidence = real_prob
        else:
            label = "uncertain"
            confidence = max(fake_prob, real_prob)

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "model": "audio_cnn_v1",
            "spectrogram": spec_b64,
        }

    # ──────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────

    def _audio_to_spectrogram_image(self, audio_path: str):
        """
        Load audio, compute mel-spectrogram, render as a colourmap image.
        Returns (PIL.Image, base64_png_string).
        """
        y, sr = librosa.load(audio_path, sr=TARGET_SR, mono=True)

        mel = librosa.feature.melspectrogram(
            y=y, sr=sr, n_mels=N_MELS, hop_length=HOP_LENGTH
        )
        mel_db = librosa.power_to_db(mel, ref=np.max)

        # Normalise to [0, 1]
        lo, hi = mel_db.min(), mel_db.max()
        if hi - lo > 1e-8:
            mel_norm = (mel_db - lo) / (hi - lo)
        else:
            mel_norm = np.zeros_like(mel_db)

        # Render with matplotlib so we get a proper colourmap (viridis)
        fig, ax = plt.subplots(figsize=(4, 2.24), dpi=100)
        ax.imshow(mel_norm, aspect="auto", origin="lower", cmap="viridis")
        ax.axis("off")
        fig.tight_layout(pad=0)

        buf = io.BytesIO()
        fig.savefig(buf, format="PNG", bbox_inches="tight", pad_inches=0)
        plt.close(fig)
        buf.seek(0)

        spec_b64 = base64.b64encode(buf.getvalue()).decode()
        buf.seek(0)
        pil_image = Image.open(buf).convert("RGB")

        return pil_image, spec_b64
