import os
import json
import shutil
import random
from pathlib import Path

import modal
from config import (
    app,
    dental_image,
    volume,
    DATASET_PATH,
    YOLO_DATASET_PATH,
    STATUS_DATASET_PATH,
    FDI_LABELS,
    FDI_TO_IDX,
    STATUS_LABELS,
    kaggle_secret,
)

# ==============================================================================
# DATASET PREPARATION PIPELINE
# ==============================================================================
# This module:
# 1. Downloads the Kaggle dataset into the persistent Modal volume.
# 2. Converts Labelme JSON annotations to YOLO segmentation format.
# 3. Builds the status classification dataset (per-tooth masked crops).

RAW_DATASET_DIR = f"{DATASET_PATH}/raw"
KAGGLE_DATASET = "zwbzwb12341234/a-dual-labeled-dataset"


def _ensure_dir(path: str):
    Path(path).mkdir(parents=True, exist_ok=True)


def _download_kaggle_dataset():
    """Download the Kaggle dataset using the official API."""
    import kaggle

    _ensure_dir(RAW_DATASET_DIR)
    print(f"Downloading Kaggle dataset: {KAGGLE_DATASET}")
    kaggle.api.dataset_download_files(
        KAGGLE_DATASET,
        path=RAW_DATASET_DIR,
        unzip=True,
        force=True,
    )
    print(f"Dataset downloaded to: {RAW_DATASET_DIR}")
    print(f"Contents: {os.listdir(RAW_DATASET_DIR)[:20]}")


def _find_images_and_labels_dirs():
    """Find the images and JSON label folders inside the extracted archive."""
    base = Path(RAW_DATASET_DIR)

    candidates_images = ["images1", "images", "Images", "Images1"]
    candidates_labels = ["labels", "Labels"]

    images_dir = None
    labels_dir = None

    for cand in candidates_images:
        p = base / cand
        if p.exists() and p.is_dir():
            images_dir = p
            break

    for cand in candidates_labels:
        p = base / cand
        if p.exists() and p.is_dir():
            labels_dir = p
            break

    if images_dir is None:
        for p in base.rglob("*"):
            if p.is_dir() and p.name.lower() in {"images", "images1"}:
                images_dir = p
                break
    if labels_dir is None:
        for p in base.rglob("*"):
            if p.is_dir() and p.name.lower() == "labels":
                labels_dir = p
                break

    if images_dir is None or labels_dir is None:
        raise RuntimeError(
            f"Could not find images/labels folders in {RAW_DATASET_DIR}. "
            f"Detected structure: {sorted(os.listdir(RAW_DATASET_DIR))}"
        )

    return images_dir, labels_dir


def _polygon_to_bbox(points):
    """Return bounding box [x1, y1, x2, y2] for a polygon."""
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return [min(xs), min(ys), max(xs), max(ys)]


def _crop_tooth(image, points, padding_ratio=0.15):
    """Extract a square crop of a tooth with padding."""
    import cv2

    h, w = image.shape[:2]
    bbox = _polygon_to_bbox(points)
    x1, y1, x2, y2 = bbox

    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    bw, bh = x2 - x1, y2 - y1
    size = max(bw, bh) * (1 + padding_ratio)

    nx1 = max(0, int(cx - size / 2))
    ny1 = max(0, int(cy - size / 2))
    nx2 = min(w, int(cx + size / 2))
    ny2 = min(h, int(cy + size / 2))

    crop = image[ny1:ny2, nx1:nx2]
    if crop.size == 0:
        return None

    crop = cv2.resize(crop, (224, 224), interpolation=cv2.INTER_AREA)
    return crop


def _masked_crop(image, points, padding_ratio=0.15):
    """Crop with mask applied: background outside the polygon becomes black."""
    import cv2
    import numpy as np

    h, w = image.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    pts = np.array(points, dtype=np.int32)
    cv2.fillPoly(mask, [pts], 255)

    masked = cv2.bitwise_and(image, image, mask=mask)
    return _crop_tooth(masked, points, padding_ratio)


def _convert_single_label(label_path: Path, images_dir: Path, yolo_out_dir: Path, status_out_dir: Path):
    """Convert one Labelme JSON file into YOLO segmentation labels and status crops."""
    import cv2

    with open(label_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    img_width = data.get("imageWidth")
    img_height = data.get("imageHeight")
    img_path_rel = data.get("imagePath", label_path.stem)

    # Find corresponding image
    img_path = images_dir / (label_path.stem + ".png")
    if not img_path.exists():
        img_path = images_dir / (label_path.stem + ".jpg")
    if not img_path.exists():
        img_path = images_dir / (label_path.stem + ".jpeg")
    if not img_path.exists():
        img_path = images_dir / img_path_rel

    if not img_path.exists():
        print(f"Warning: missing image for label {label_path}. Skipping.")
        return None

    image = cv2.imread(str(img_path))
    if image is None:
        print(f"Warning: cannot read image {img_path}. Skipping.")
        return None

    if img_width is None or img_height is None:
        img_height, img_width = image.shape[:2]

    yolo_lines = []
    status_crops = []

    for shape in data.get("shapes", []):
        if shape.get("shape_type") != "polygon":
            continue

        label = str(shape.get("label", "")).strip()
        if label not in FDI_TO_IDX:
            continue

        points = shape.get("points", [])
        if len(points) < 3:
            continue

        class_idx = FDI_TO_IDX[label]

        # Normalize points for YOLO
        norm_points = []
        for x, y in points:
            norm_points.append(x / img_width)
            norm_points.append(y / img_height)

        line = f"{class_idx} " + " ".join(f"{p:.6f}" for p in norm_points)
        yolo_lines.append(line)

        # Status from group_id (null = 0 = normal)
        group_id = shape.get("group_id")
        status = 0 if group_id is None else int(group_id)
        if status not in STATUS_LABELS:
            status = 0

        crop = _masked_crop(image, points)
        if crop is not None:
            status_crops.append((status, crop))

    return {
        "yolo_lines": yolo_lines,
        "status_crops": status_crops,
        "image_path": img_path,
    }


def _build_datasets(split_ratios=(0.8, 0.1, 0.1), seed=42):
    """Build YOLO and status datasets."""
    import cv2

    images_dir, labels_dir = _find_images_and_labels_dirs()

    # List all JSON labels that have a corresponding image
    label_files = sorted(labels_dir.glob("*.json"))
    valid_samples = []
    for lf in label_files:
        img_candidate = images_dir / (lf.stem + ".png")
        if not img_candidate.exists():
            img_candidate = images_dir / (lf.stem + ".jpg")
        if img_candidate.exists():
            valid_samples.append((lf, img_candidate))

    print(f"Samples found: {len(valid_samples)}")

    # Shuffle and split
    random.seed(seed)
    random.shuffle(valid_samples)
    n = len(valid_samples)
    n_train = int(n * split_ratios[0])
    n_val = int(n * split_ratios[1])

    splits = {
        "train": valid_samples[:n_train],
        "val": valid_samples[n_train : n_train + n_val],
        "test": valid_samples[n_train + n_val :],
    }

    # Create directory structure
    for split in ["train", "val", "test"]:
        _ensure_dir(f"{YOLO_DATASET_PATH}/images/{split}")
        _ensure_dir(f"{YOLO_DATASET_PATH}/labels/{split}")
        for s in STATUS_LABELS:
            _ensure_dir(f"{STATUS_DATASET_PATH}/{split}/{s}")

    for split, samples in splits.items():
        print(f"Processing {split}: {len(samples)} samples")
        for lf, img_path in samples:
            result = _convert_single_label(
                lf, images_dir, YOLO_DATASET_PATH, STATUS_DATASET_PATH
            )
            if result is None:
                continue

            # Copy image into YOLO structure
            dst_img = f"{YOLO_DATASET_PATH}/images/{split}/{img_path.name}"
            shutil.copy(str(img_path), dst_img)

            # Write YOLO label file
            dst_label = f"{YOLO_DATASET_PATH}/labels/{split}/{img_path.stem}.txt"
            with open(dst_label, "w", encoding="utf-8") as f:
                f.write("\n".join(result["yolo_lines"]))

            # Save status crops
            for idx, (status, crop) in enumerate(result["status_crops"]):
                crop_path = f"{STATUS_DATASET_PATH}/{split}/{status}/{img_path.stem}_{idx}.png"
                cv2.imwrite(crop_path, crop)

    # Generate data.yaml for YOLO
    data_yaml = f"""path: {YOLO_DATASET_PATH}
train: images/train
val: images/val
test: images/test
nc: {len(FDI_LABELS)}
names: {FDI_LABELS}
"""
    yaml_path = f"{YOLO_DATASET_PATH}/data.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(data_yaml)

    print(f"YOLO dataset saved to: {YOLO_DATASET_PATH}")
    print(f"Status dataset saved to: {STATUS_DATASET_PATH}")
    print(f"{yaml_path} generated.")

    return {
        "train": len(splits["train"]),
        "val": len(splits["val"]),
        "test": len(splits["test"]),
    }


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    secrets=[kaggle_secret],
    timeout=3600,
)
def prepare_dataset(force_download: bool = False, split_ratios=(0.8, 0.1, 0.1)):
    """
    Download the Kaggle dataset, convert Labelme JSON to YOLO segmentation format,
    and build the status classification dataset.
    """
    raw_marker = Path(RAW_DATASET_DIR) / ".download_complete"

    if force_download or not raw_marker.exists():
        _download_kaggle_dataset()
        raw_marker.touch()
    else:
        print(f"Dataset already downloaded at {RAW_DATASET_DIR}. Skipping download.")

    stats = _build_datasets(split_ratios=split_ratios)

    # Commit changes to the persistent volume
    volume.commit()

    return {
        "status": "done",
        "dataset_path": YOLO_DATASET_PATH,
        "status_dataset_path": STATUS_DATASET_PATH,
        "splits": stats,
    }


@app.local_entrypoint()
def main():
    print("Starting dataset preparation in the cloud...")
    result = prepare_dataset.remote()
    print(f"Result: {result}")


if __name__ == "__main__":
    app.run()
