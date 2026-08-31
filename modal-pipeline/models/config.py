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
STATUS_DATASET_PATH = "/data/dataset/anomaly_status"
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

# Source anomaly-detection dataset (raw YOLO format from Kaggle)
ANOMALY_RAW_DATASET_PATH = "/data/dataset/anomaly_raw/YOLO/YOLO"

# Classes from the raw anomaly dataset that relate to teeth (22 classes selected from 31)
ANOMALY_TOOTH_CLASS_IDS = [
    0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 14, 15, 16, 18, 19, 22, 23, 24, 25, 29, 30
]

# Mapping from the raw anomaly class index to the consecutive classifier index
ANOMALY_ORIGINAL_TO_CLASSIFIER = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
    11: 10, 14: 11, 15: 12, 16: 13, 18: 14, 19: 15, 22: 16, 23: 17,
    24: 18, 25: 19, 29: 20, 30: 21,
}

# Clinical status / anomaly classification labels (22 classes)
STATUS_LABELS = {
    0: "Caries",
    1: "Crown",
    2: "Filling",
    3: "Implant",
    4: "Malaligned",
    5: "Missing teeth",
    6: "Periapical lesion",
    7: "Retained root",
    8: "Root Canal Treatment",
    9: "Root Piece",
    10: "Impacted tooth",
    11: "Fracture teeth",
    12: "Permanent Teeth",
    13: "Supra Eruption",
    14: "Abutment",
    15: "Attrition",
    16: "Metal band",
    17: "Orthodontic brackets",
    18: "Permanent retainer",
    19: "Post-core",
    20: "Root resorption",
    21: "Primary teeth",
}
