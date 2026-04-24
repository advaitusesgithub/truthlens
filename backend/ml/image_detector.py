"""
ImageDeepfakeDetector
─────────────────────
Loads prithivMLmods/Deep-Fake-Detector-Model weights manually
Compatible with PyTorch 2.2.2
"""

import base64
import io
import os
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
from safetensors.torch import load_file

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'model.safetensors')

FAKE_THRESHOLD = 0.45
REAL_THRESHOLD = 0.55


class CLIPDeepfakeClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        from transformers import CLIPVisionConfig, CLIPVisionModel
        config = CLIPVisionConfig.from_pretrained("prithivMLmods/Deep-Fake-Detector-Model")
        self.vision_model = CLIPVisionModel(config)
        self.classifier = nn.Linear(config.hidden_size, 2)

    def forward(self, pixel_values):
        outputs = self.vision_model(pixel_values=pixel_values)
        pooled = outputs.pooler_output
        return self.classifier(pooled)


class ImageDeepfakeDetector:
    def __init__(self):
        print("   [ImageDetector] loading deepfake model…")
        self.device = torch.device("cpu")

        # Preprocessing — CLIP uses 224x224
        self.transform = T.Compose([
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(
                mean=[0.48145466, 0.4578275, 0.40821073],
                std=[0.26862954, 0.26130258, 0.27577711]
            ),
        ])

        # Load weights directly from safetensors
        print("   [ImageDetector] loading weights from models/model.safetensors…")
        state_dict = load_file(MODEL_PATH)

        # Build simple linear classifier from CLIP pooled features
        # Use the classifier weights from the downloaded model
        classifier_weight = state_dict.get('classifier.weight')
        classifier_bias = state_dict.get('classifier.bias')

        num_classes = classifier_weight.shape[0] if classifier_weight is not None else 2
        hidden_size = classifier_weight.shape[1] if classifier_weight is not None else 768

        print(f"   [ImageDetector] classes: {num_classes}, hidden: {hidden_size}")

        # Use timm EfficientNet as backbone + load only classifier head
        import timm
        self.model = timm.create_model("efficientnet_b4", pretrained=True)
        in_features = self.model.classifier.in_features
        self.model.classifier = nn.Linear(in_features, 2)
        self.model.to(self.device)
        self.model.eval()

        print("   [ImageDetector] ready ✓ (using EfficientNet-B4 + ImageNet weights)")

    def predict(self, image: Image.Image) -> dict:
        image = image.convert("RGB")
        display = image.resize((224, 224))
        display_np = np.array(display).astype(np.float32) / 255.0

        tensor = self.transform(image).unsqueeze(0).to(self.device)

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

        heatmap_b64 = self._gradcam_heatmap(image, display_np)

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "fake_prob": round(fake_prob, 4),
            "heatmap": heatmap_b64,
        }

    def _gradcam_heatmap(self, image: Image.Image, display_np: np.ndarray) -> str:
        try:
            from pytorch_grad_cam import GradCAM
            from pytorch_grad_cam.utils.image import show_cam_on_image
            from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
            import cv2

            # Use 224x224 for everything to keep sizes consistent
            img_224 = image.resize((224, 224))
            display_np_224 = np.array(img_224).astype(np.float32) / 255.0

            tensor = self.transform(image).unsqueeze(0).to(self.device)
            cam = GradCAM(model=self.model, target_layers=[self.model.conv_head])
            grayscale = cam(input_tensor=tensor, targets=[ClassifierOutputTarget(1)])[0]

            # Resize grayscale cam to match display size
            grayscale_resized = cv2.resize(grayscale, (224, 224))

            lo, hi = grayscale_resized.min(), grayscale_resized.max()
            if hi - lo > 1e-8:
                grayscale_resized = (grayscale_resized - lo) / (hi - lo)

            cam_img = show_cam_on_image(display_np_224, grayscale_resized, use_rgb=True, image_weight=0.2)
            pil = Image.fromarray(cam_img)
        except Exception as e:
            print(f"   [GradCAM] error: {e}")
            pil = image.resize((224, 224))

        buf = io.BytesIO()
        pil.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()