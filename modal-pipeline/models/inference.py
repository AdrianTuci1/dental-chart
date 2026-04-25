import os
import modal
from config import app, dental_image, volume, MODELS_DIR

def _run_prediction_core(img_array):
    """Logica internă de predicție (Python simplu)"""
    import cv2
    import numpy as np
    from ultralytics import YOLO, FastSAM
    from preprocessing import preprocess_for_inference
    
    # original dimensions
    h_orig, w_orig = img_array.shape[:2]
    
    # 1. Load models
    model_weight = f"{MODELS_DIR}/new_model/best.pt"
    detector = YOLO(model_weight) if os.path.exists(model_weight) else YOLO("yolov8n.pt")
    sam_model = FastSAM("FastSAM-s.pt") 
    
    # 2. Preprocess (Squash to 640x640 - RAW for testing)
    processed_img = cv2.resize(img_array, (640, 640), interpolation=cv2.INTER_AREA)
    
    # 3. Detect boxes on 640x640 (very lower conf for debug)
    det_results = detector.predict(processed_img, conf=0.1, verbose=False, imgsz=640)
    boxes = det_results[0].boxes
    
    if len(boxes) == 0:
        return {"detections": [], "count": 0}

    # 4. Smart Contours (SAM) on 640x640
    sam_results = sam_model.predict(
        processed_img, 
        bboxes=boxes.xyxy, 
        device="cuda", 
        imgsz=640, 
        conf=0.4, 
        iou=0.9,
        retina_masks=True,
        verbose=False
    )
    
    results_data = []
    # Ratios for remapping coordinates
    rx = w_orig / 640.0
    ry = h_orig / 640.0
    
    if len(sam_results) > 0 and sam_results[0].masks is not None:
        masks = sam_results[0].masks.xy
        for i, mask in enumerate(masks):
            # Remapare coordonate BOXES
            bx1, by1, bx2, by2 = boxes.xyxy[i]
            orig_bbox = [
                float(bx1.item() * rx),
                float(by1.item() * ry),
                float(bx2.item() * rx),
                float(by2.item() * ry)
            ]
            
            # Remapare coordonate CONTOUR
            orig_contour = [[float(p[0] * rx), float(p[1] * ry)] for p in mask]
            
            # Filtru basic de dimensiune (după remapare)
            c_w = (max(p[0] for p in mask) - min(p[0] for p in mask)) * rx
            c_h = (max(p[1] for p in mask) - min(p[1] for p in mask)) * ry
            if (c_w * c_h) > (w_orig * h_orig * 0.2):
                continue
                
            results_data.append({
                "label": detector.names[int(boxes.cls[i])],
                "confidence": float(boxes.conf[i].item()),
                "bbox": orig_bbox,
                "contour": orig_contour
            })
            
    return {"detections": results_data, "count": len(results_data)}

@app.function(
    image=dental_image,
    volumes={"/data": volume},
    gpu="T4"
)
def run_prediction(img_array):
    """Wrapper Modal pentru logica de predicție"""
    return _run_prediction_core(img_array)

@app.function(image=dental_image, volumes={"/data": volume}, gpu="T4")
@modal.fastapi_endpoint(method="POST")
def api_predict(image_data: bytes):
    """
    Ruta API: Trimite imaginea ca body (binary) și primește JSON.
    """
    import numpy as np
    import cv2
    # Convertim bytes în imagine OpenCV
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Rulăm predicția
    return _run_prediction_core(img)

@app.function(image=dental_image, volumes={"/data": volume}, gpu="T4")
def predict_cli(image_path: str):
    """Funcție pentru testare din linia de comandă"""
    import cv2
    import os
    
    if not os.path.exists(image_path):
        print(f"❌ EROARE: Fișierul nu există la calea: {image_path}")
        # Listăm ce există în folder pentru debug
        base_dir = os.path.dirname(image_path)
        if os.path.exists(base_dir):
            print(f"Fișiere disponibile în {base_dir}: {os.listdir(base_dir)[:5]}...")
        return {"error": "file_not_found"}

    img = cv2.imread(image_path)
    result = _run_prediction_core(img)
    print(f"✅ Detectat: {result['count']} elemente.")
    return result

@app.local_entrypoint()
def save_detections():
    import json
    print("🚀 Se rulează inferența pe Modal pentru chart2.png...")
    # Executăm funcția de pe Modal
    result = predict_cli.remote("/data/chart2.png")
    
    output_path = "public/detections.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"✅ Rezultatele au fost salvate local în: {output_path}")
