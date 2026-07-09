import os
import modal

from config import app, dental_image, volume, YOLO_DATASET_PATH, MODELS_DIR

# IMPORTANT: Run this function with: modal run modal-pipeline/models/train.py
@app.function(
    image=dental_image,
    volumes={"/data": volume},
    gpu="L40S",
    timeout=28800      # 8 hours max
)
def train(epochs: int = 100, batch_size: int = 16, model_size: str = "x"):
    """
    Train a YOLO11-seg model for tooth segmentation and FDI numbering.

    Args:
        epochs: number of epochs (default 100).
        batch_size: batch size (default 16, adjust based on GPU memory).
        model_size: YOLO11 backbone size: n, s, m, l, x (default x for maximum accuracy).
    """
    from ultralytics import YOLO
    
    yaml_path = f"{YOLO_DATASET_PATH}/data.yaml"
    if not os.path.exists(yaml_path):
        print(f"ERROR: File not found: {yaml_path}")
        print("Make sure you ran data_preparation.py to prepare the dataset.")
        return

    model_name = f"yolo11{model_size}-seg.pt"
    print(f"Starting YOLO11-seg training ({model_name}) for {epochs} epochs...")
    
    model = YOLO(model_name)
    
    model.train(
        data=yaml_path,
        epochs=epochs,
        batch=batch_size,
        imgsz=640,
        optimizer="Adam",
        lr0=0.0001,
        project=MODELS_DIR,
        name="dental_fdi_segmentation",
        device=0,
        save=True,
        cache=True,
        patience=10,
        # Segmentation-specific settings
        overlap_mask=True,
        mask_ratio=4,
    )
    
    print("FDI segmentation training completed!")
    print(f"Model saved at: {MODELS_DIR}/dental_fdi_segmentation/weights/best.pt")
    volume.commit()

if __name__ == "__main__":
    app.run()
