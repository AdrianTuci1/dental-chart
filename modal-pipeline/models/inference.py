import os
import modal

from config import app, dental_image, volume, MODELS_DIR, FDI_LABELS, STATUS_LABELS

# ==============================================================================
# DUAL-MODEL INFERENCE
# ==============================================================================
# 1. YOLO11-seg detects each tooth, assigns an FDI number, and generates a mask.
# 2. ResNet18 classifies the status of each tooth based on the masked crop.

FDI_MODEL_PATH = f"{MODELS_DIR}/dental_fdi_segmentation/weights/best.pt"
STATUS_MODEL_PATH = f"{MODELS_DIR}/dental_status_classifier/best_status_classifier.pth"
NUM_STATUS_CLASSES = 7


def _load_status_classifier():
    """Load the trained status classifier."""
    import torch
    from torchvision import models

    if not os.path.exists(STATUS_MODEL_PATH):
        return None

    model = models.resnet18(weights=None)
    num_ftrs = model.fc.in_features
    model.fc = torch.nn.Linear(num_ftrs, NUM_STATUS_CLASSES)
    model.load_state_dict(torch.load(STATUS_MODEL_PATH, map_location="cpu"))
    model.eval()
    return model


def _status_transform():
    from torchvision import transforms
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


def _masked_crop_from_points(image, points, padding_ratio=0.15):
    """Square crop with mask based on a polygon."""
    import cv2
    import numpy as np

    h, w = image.shape[:2]
    pts = np.array(points, dtype=np.int32)

    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(mask, [pts], 255)
    masked = cv2.bitwise_and(image, image, mask=mask)

    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)

    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    size = max(x2 - x1, y2 - y1) * (1 + padding_ratio)

    nx1 = max(0, int(cx - size / 2))
    ny1 = max(0, int(cy - size / 2))
    nx2 = min(w, int(cx + size / 2))
    ny2 = min(h, int(cy + size / 2))

    crop = masked[ny1:ny2, nx1:nx2]
    if crop.size == 0:
        return None
    crop = cv2.resize(crop, (224, 224), interpolation=cv2.INTER_AREA)
    return crop


def _predict_status(crop, model):
    """Predict the status of one tooth from a crop."""
    import cv2
    import torch
    from PIL import Image

    if model is None or crop is None:
        return {"status_id": -1, "status_name": "unknown", "confidence": 0.0}

    transform = _status_transform()
    pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    tensor = transform(pil).unsqueeze(0)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, 1)

    status_id = int(pred.item())
    return {
        "status_id": status_id,
        "status_name": STATUS_LABELS.get(status_id, "unknown"),
        "confidence": float(conf.item()),
    }


def _run_prediction_core(img_array):
    """Internal prediction logic."""
    import cv2
    import numpy as np
    from ultralytics import YOLO

    h_orig, w_orig = img_array.shape[:2]

    # 1. Load FDI segmentation model
    model_path = FDI_MODEL_PATH if os.path.exists(FDI_MODEL_PATH) else "yolo11x-seg.pt"
    model = YOLO(model_path)
    status_model = _load_status_classifier()

    # 2. Run segmentation
    results = model.predict(img_array, conf=0.25, verbose=False, imgsz=640)
    result = results[0]

    if result.boxes is None or len(result.boxes) == 0:
        return {"teeth": [], "count": 0}

    detections = []
    boxes = result.boxes
    masks = result.masks.xy if result.masks is not None else []

    for i, mask in enumerate(masks):
        cls_id = int(boxes.cls[i].item())
        conf = float(boxes.conf[i].item())
        fdi_label = FDI_LABELS[cls_id] if 0 <= cls_id < len(FDI_LABELS) else "unknown"

        bx1, by1, bx2, by2 = boxes.xyxy[i]
        bbox = [
            float(bx1.item()),
            float(by1.item()),
            float(bx2.item()),
            float(by2.item()),
        ]

        contour = [[float(p[0]), float(p[1])] for p in mask]

        # Masked crop for status
        crop = _masked_crop_from_points(img_array, mask)
        status = _predict_status(crop, status_model)

        detections.append({
            "fdi": fdi_label,
            "confidence_fdi": conf,
            "bbox": bbox,
            "contour": contour,
            "status": status,
        })

    return {"teeth": detections, "count": len(detections)}


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    gpu="T4"
)
def run_prediction(img_array):
    """Modal wrapper for prediction logic."""
    import numpy as np
    return _run_prediction_core(np.asarray(img_array))


from fastapi import Request


@app.function(image=dental_image, volumes={"/data": volume}, gpu="T4")
@modal.fastapi_endpoint(method="POST")
async def api_predict(request: Request):
    """
    API route: send image as binary body and receive JSON.
    """
    import cv2
    import numpy as np
    image_data = await request.body()
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return _run_prediction_core(img)


@app.function(image=dental_image, volumes={"/data": volume}, gpu="T4")
def predict_cli(image_path: str):
    """Command-line prediction function."""
    import cv2
    if not os.path.exists(image_path):
        print(f"ERROR: File not found: {image_path}")
        return {"error": "file_not_found"}

    img = cv2.imread(image_path)
    result = _run_prediction_core(img)
    print(f"Detected: {result['count']} teeth.")
    return result


@app.local_entrypoint()
def save_detections():
    import json
    print("Running inference on Modal for chart2.png...")
    result = predict_cli.remote("/data/chart2.png")

    output_path = "public/detections.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Results saved locally to: {output_path}")
