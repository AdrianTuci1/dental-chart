import os
import modal
import cv2
import numpy as np
import base64
from config import app, dental_image, volume, MODELS_DIR

@app.function(
    image=dental_image,
    volumes={"/data": volume},
    gpu="A10G"
)
def run_prediction(img_array):
    """Logica internă de predicție refolosită de CLI și Web API"""
    from ultralytics import YOLO, FastSAM
    from ultralytics.models.fastsam import FastSAMPrompt
    from preprocessing import apply_dental_enhancement
    
    # 1. Load models
    model_weight = f"{MODELS_DIR}/dental_segmentation/weights/best.pt"
    detector = YOLO(model_weight) if os.path.exists(model_weight) else YOLO("yolov8n.pt")
    sam_model = FastSAM("FastSAM-s.pt") 

    # 2. Preprocess
    processed_img = apply_dental_enhancement(img_array)
    
    # 3. Detect boxes
    det_results = detector.predict(processed_img, conf=0.25)
    boxes = det_results[0].boxes
    
    if len(boxes) == 0:
        return {"detections": [], "count": 0}

    # 4. Smart Contours (SAM)
    sam_results = sam_model(processed_img, device="cuda", imgsz=1024, conf=0.4, iou=0.9)
    prompt_process = FastSAMPrompt(processed_img, sam_results, device="cuda")
    ann = prompt_process.box_prompt(bboxes=boxes.xyxy.cpu().numpy())
    
    results_data = []
    if hasattr(ann, 'masks') and ann.masks is not None:
        masks = ann.masks.xy
        for i, mask in enumerate(masks):
            results_data.append({
                "label": detector.names[int(boxes.cls[i])],
                "confidence": float(boxes.conf[i]),
                "bbox": boxes.xyxy[i].cpu().numpy().tolist(),
                "contour": mask.tolist() # Lista de puncte [x, y]
            })
            
    return {"detections": results_data, "count": len(results_data)}

@app.function(image=dental_image, volumes={"/data": volume}, gpu="A10G")
@modal.web_endpoint(method="POST")
def api_predict(image_data: bytes):
    """
    Ruta API: Trimite imaginea ca body (binary) și primește JSON.
    """
    # Convertim bytes în imagine OpenCV
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Rulăm predicția
    result = run_prediction(img)
    return result

@app.function(image=dental_image, volumes={"/data": volume}, gpu="A10G")
def predict_cli(image_path: str):
    """Funcție pentru testare din linia de comandă"""
    img = cv2.imread(image_path)
    result = run_prediction(img)
    print(f"✅ Detectat: {result['count']} elemente.")
    return result
