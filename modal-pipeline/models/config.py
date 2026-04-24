import modal
import os

# ==============================================================================
# CONFIGURAȚIE MODAL - dental-chart
# ==============================================================================
# Acest fișier definește mediul de execuție, dependențele și resursele partajate.

# Definirea imaginii containerului
# Adăugăm dependențele de sistem pentru OpenCV și bibliotecile Python necesare.
dental_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libgl1", "libglib2.0-0", "libsm6", "libxext6", "libxrender1")
    .pip_install(
        "ultralytics",      # YOLOv8 pentru detecție
        "opencv-python",    # Procesare imagine
        "matplotlib",       # Vizualizare rezultate
        "pillow",
        "pyyaml"
    )
    # Includem automat toate fișierele de cod din acest folder în imaginea containerului.
    # Această metodă este preferată față de Mount-uri explicite.
    .add_local_dir(os.path.dirname(__file__), remote_path="/root")
)

# Crearea aplicației Modal (fostul stub)
app = modal.App("dental-tooth-segmentation")

# Volum persistent pentru a păstra dataset-ul și modelele antrenate între rulări
# Acesta va fi montat în container la calea /data
volume = modal.Volume.from_name("dental-data-storage", create_if_missing=True)

# Definim constantele pentru căi pentru a fi consecvenți în toate modulele
DATA_DIR = "/data"
DATASET_PATH = "/data/dataset"
MODELS_DIR = "/data/models"
