import modal
import os

# Define the image with all dependencies
# We download the model during the image build process to bake it into the image.
image = (
    modal.Image.from_registry("python:3.11-slim")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0") # OpenCV dependencies
    .pip_install("ultralytics", "huggingface_hub", "pillow", "numpy")
    .run_commands(
        "mkdir -p /models",
        # Download Pathology model
        "huggingface-cli download nsitnov/8024-yolov8-model best.pt --local-dir /models/pathology",
        # Download Tooth detection model (using a common anatomy model)
        "huggingface-cli download keremberke/yolov8m-dental-radiography best.pt --local-dir /models/anatomy"
    )
)

app = modal.App("dental-xray-analysis", image=image)

def box_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    return interArea / float(boxAArea + boxBArea - interArea)

@app.function(gpu="T4")
def predict(image_bytes: bytes):
    from ultralytics import YOLO
    from PIL import Image
    import io

    # Load models
    pathology_model = YOLO("/models/pathology/best.pt")
    anatomy_model = YOLO("/models/anatomy/best.pt")
    
    img = Image.open(io.BytesIO(image_bytes))
    
    # Run both inferences
    path_results = pathology_model.predict(img, conf=0.25)
    anat_results = anatomy_model.predict(img, conf=0.25)
    
    teeth = []
    for res in anat_results:
        boxes = res.boxes.cpu().numpy()
        for i in range(len(boxes)):
            box = boxes[i]
            # Map class ID to tooth number if the model supports it
            # For simplicity, we'll return the label from the anatomy model
            teeth.append({
                "label": res.names[int(box.cls[0])],
                "box": box.xyxy[0].tolist()
            })

    formatted_findings = []
    for res in path_results:
        boxes = res.boxes.cpu().numpy()
        for i in range(len(boxes)):
            box = boxes[i]
            path_box = box.xyxy[0].tolist()
            path_label = res.names[int(box.cls[0])].lower()
            
            # Find closest tooth (ISO Mapping)
            best_tooth = "Unknown"
            max_iou = 0.0
            for tooth in teeth:
                iou = box_iou(path_box, tooth["box"])
                if iou > max_iou:
                    max_iou = iou
                    best_tooth = tooth["label"]
            
            iso = int(best_tooth) if best_tooth.isdigit() else 0
            
            # Dental Chart Formatting Logic
            finding_update = { "isoNumber": iso }
            
            if "caries" in path_label or "decay" in path_label:
                finding_update["pathology"] = { "decay": [{ "type": "Dentin", "zones": ["Occlusal"] }] }
            elif "filling" in path_label:
                finding_update["restoration"] = { "fillings": [{ "zones": ["Occlusal"], "material": "Composite", "quality": "Sufficient" }] }
            elif "crown" in path_label:
                finding_update["restoration"] = { "crowns": [{ "type": "Single", "material": "Ceramic", "base": "Natural", "quality": "Sufficient" }] }
            elif "implant" in path_label:
                finding_update["restoration"] = { "crowns": [{ "type": "Single", "material": "Ceramic", "base": "Implant", "quality": "Sufficient" }] }
            elif "impacted" in path_label:
                finding_update["pathology"] = { "developmentDisorder": True }
            elif "missing" in path_label:
                finding_update["isMissing"] = True
            
            # Metadata for UI/Debug
            finding_update["ml_metadata"] = {
                "label": path_label,
                "confidence": float(box.conf[0]),
                "box": path_box,
                "tooth_label": best_tooth
            }
            formatted_findings.append(finding_update)
            
    return {"findings": formatted_findings, "raw_teeth": teeth}

@app.function()
@modal.web_endpoint(method="POST")
async def api_predict(file: modal.FastAPI.UploadFile):
    """Web endpoint for the ML service to call"""
    image_bytes = await file.read()
    # Call the GPU function
    findings = predict.remote(image_bytes)
    return {"status": "success", "findings": findings}
