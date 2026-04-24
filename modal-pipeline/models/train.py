import os
import modal
from config import app, dental_image, volume, DATASET_PATH, MODELS_DIR

# IMPORTANT: Rulați această funcție folosind: modal run train.py
@app.function(
    image=dental_image,
    volumes={"/data": volume},
    gpu="A10G",
    timeout=10800      # 8 ore maxim (siguranță totală)
)
def train(epochs: int = 50, batch_size: int = 16):
    """
    Antrenează un model YOLOv8 Segmentation pe setul de date dentare.
    Acest model va învăța să traseze CONTURUL (segmentarea) dintelui.
    """
    from ultralytics import YOLO
    
    # Verificăm dacă dataset-ul există
    yaml_path = f"{DATASET_PATH}/data.yaml"
    if not os.path.exists(yaml_path):
        print(f"❌ EROARE: Nu am găsit fișierul {yaml_path}")
        print("Asigurați-vă că ați încărcat dataset-ul în Volume-ul Modal.")
        return

    print(f"🚀 Pornire antrenare pe {epochs} epoci folosind YOLO11x (Detection + FastSAM pipeline)...")
    
    # Încărcăm motorul de detecție: YOLO11x
    # Folosim varianta de detecție deoarece dataset-ul are doar bounding boxes.
    # Segmentarea este realizată ulterior prin FastSAM în pipeline-ul de inferență.
    model = YOLO("yolo11x.pt")
    
    # Antrenare cu hiperparametrii din lucrarea de cercetare (Tabelul IV)
    model.train(
        data=yaml_path,
        epochs=epochs,   
        batch=batch_size,
        imgsz=640,       
        optimizer='Adam',# Forțăm optimizatorul Adam conform lucrării
        lr0=0.0001,      # Rata de învățare 1e-4
        project=MODELS_DIR,
        name="dental_segmentation",
        device=0,        # Folosește GPU
        save=True,
        cache=True,
        patience=5       # Early stopping menționat în lucrare
    )
    
    print("✅ Antrenare finalizată! Modelul a fost salvat în volumul persistent.")
    volume.commit() # Confirmăm scrierea datelor în volumul cloud

if __name__ == "__main__":
    app.run()
