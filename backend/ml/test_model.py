# # test_model.py

# import torch
# import timm
# from huggingface_hub import hf_hub_download

# print("📥 Downloading model weights...")

# # Step 1: Download weights
# model_path = hf_hub_download(
#     repo_id="selimsef/dfdc_deepfake_challenge",
#     filename="efficientnet-b4.pth"   # may change if error comes
# )

# print("✅ Weights downloaded at:", model_path)

# # Step 2: Load model architecture
# print("⚙️ Loading EfficientNet-B4 architecture...")
# model = timm.create_model('efficientnet_b4', pretrained=False)

# # Step 3: Load weights
# print("📦 Loading checkpoint...")
# checkpoint = torch.load(model_path, map_location="cpu")

# # Debug: check what's inside checkpoint
# print("🔍 Checkpoint keys:", checkpoint.keys())

# # Try loading weights
# try:
#     model.load_state_dict(checkpoint)
# except:
#     print("⚠️ Trying alternative loading method...")
#     model.load_state_dict(checkpoint['model'], strict=False)

# model.eval()
# print("✅ Model loaded successfully!")

# # Step 4: Smoke test
# print("🧪 Running smoke test...")

# dummy = torch.randn(1, 3, 224, 224)

# with torch.no_grad():
#     output = model(dummy)

# print("🎯 Output shape:", output.shape)
# print("🚀 Everything working!")

import torch
import timm

print("⚙️ Loading EfficientNet-B4 (pretrained)...")

model = timm.create_model('efficientnet_b4', pretrained=True)
model.eval()

print("✅ Model loaded successfully!")

dummy = torch.randn(1, 3, 224, 224)

with torch.no_grad():
    output = model(dummy)

print("🎯 Output shape:", output.shape)
print("🚀 Smoke test passed!")