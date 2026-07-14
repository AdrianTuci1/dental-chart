import modal
import os

# ==============================================================================
# MODAL CONFIGURATION - dental-chart
# ==============================================================================
# This file defines the container image, dependencies, and shared resources.

# Container image definition
# System dependencies for OpenCV and required Python libraries are added.
dental_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libgl1", "libglib2.0-0", "libsm6", "libxext6", "libxrender1")
    .pip_install(
        "ultralytics>=8.3.0",  # YOLOv8/YOLO11 for detection and segmentation
        "opencv-python",       # Image processing
        "matplotlib",          # Result visualization
        "pillow",
        "pyyaml",
        "fastapi",
        "kaggle",              # Download Kaggle datasets
        "torch",               # PyTorch for status classifier
        "torchvision",
    )
    # Automatically include all code files in this folder in the container image.
    # This is preferred over explicit mounts.
    .add_local_dir(os.path.dirname(__file__), remote_path="/root")
)

# Create the Modal app
app = modal.App("dental-tooth-segmentation")

# Persistent volume to keep dataset and trained models between runs
# Mounted at /data inside the container
volume = modal.Volume.from_name("dental-data-storage", create_if_missing=True)

# Secret for Kaggle credentials (KAGGLE_USERNAME, KAGGLE_KEY)
kaggle_secret = modal.Secret.from_name("kaggle-creds", required_keys=["KAGGLE_USERNAME", "KAGGLE_KEY"])

# Path constants for consistency across modules
DATA_DIR = "/data"
DATASET_PATH = "/data/dataset"
YOLO_DATASET_PATH = "/data/dataset/yolo"
STATUS_DATASET_PATH = "/data/dataset/status"
MODELS_DIR = "/data/models"

# FDI numbering classes supported by the dataset (33 classes)
FDI_LABELS = [
    "11", "12", "13", "14", "15", "16", "17", "18",
    "21", "22", "23", "24", "25", "26", "27", "28",
    "31", "32", "33", "34", "35", "36", "37", "38",
    "41", "42", "43", "44", "45", "46", "47", "48",
    "91",
]
FDI_TO_IDX = {label: idx for idx, label in enumerate(FDI_LABELS)}

# Clinical status classes (7 classes)
STATUS_LABELS = {
    0: "Tooth without anomalies",
    1: "Tooth with fillings",
    2: "Tooth with RCT",
    3: "Tooth with crown",
    4: "Tooth with caries",
    5: "Residual root",
    6: "Tooth with RCT and crown",
}
