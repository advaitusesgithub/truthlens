# # from PIL import Image
# # from ml.image_detector import ImageDeepfakeDetector

# # detector = ImageDeepfakeDetector()

# # image = Image.open("test.jpg")  # put any image in backend folder

# # result = detector.predict(image)

# # print(result)


# from PIL import Image
# from ml.image_detector import ImageDeepfakeDetector

# detector = ImageDeepfakeDetector()

# image = Image.open("test.jpg")

# result = detector.predict(image)

# print("Label:", result["label"])
# print("Confidence:", result["confidence"])

# # Save heatmap
# result["heatmap"].save("heatmap.jpg")
# print("🔥 Heatmap saved as heatmap.jpg")

"""
Quick smoke test — run from inside /backend:
    python -m ml.test_detector
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from PIL import Image
from ml.image_detector import ImageDeepfakeDetector
import base64, io

print("=" * 50)
print("TruthLens — ImageDetector smoke test")
print("=" * 50)

detector = ImageDeepfakeDetector()

test_img_path = Path(__file__).parent.parent / "test.jpg"
if test_img_path.exists():
    image = Image.open(test_img_path)
    print(f"Using: {test_img_path}")
else:
    print("test.jpg not found — using random noise image")
    import numpy as np
    arr = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    image = Image.fromarray(arr)

result = detector.predict(image)
print(f"Label:      {result['label']}")
print(f"Confidence: {result['confidence']:.4f}")
print(f"Fake prob:  {result['fake_prob']:.4f}")
print(f"Heatmap:    {len(result['heatmap'])} bytes (base64)")

heatmap_bytes = base64.b64decode(result["heatmap"])
heatmap_img = Image.open(io.BytesIO(heatmap_bytes))
heatmap_img.save("heatmap.jpg")
print("Heatmap saved -> heatmap.jpg")
print("Smoke test PASSED")
