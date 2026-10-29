import os
import shutil
from pathlib import Path

import modal

from config import (
    app,
    dental_image,
    volume,
    STATUS_DATASET_PATH,
    ANOMALY_RAW_DATASET_PATH,
    ANOMALY_TOOTH_CLASS_IDS,
    ANOMALY_ORIGINAL_TO_CLASSIFIER,
)


# ==============================================================================
# ANOMALY CLASSIFICATION DATASET PREPARATION
# ==============================================================================
# Converts the raw YOLO anomaly-detection dataset into a ResNet-friendly
# image-folder classification dataset. Only tooth-related classes are kept.
#
# For every YOLO label file in train/valid/test we:
#   1. load the corresponding image
#   2. keep only bounding boxes whose class is in ANOMALY_TOOTH_CLASS_IDS
#   3. extract a padded square crop around each box
#   4. resize it to 224x224 and save it under STATUS_DATASET_PATH/<split>/<class_idx>


def _bbox_crop(image, x_center, y_center, w, h, padding_ratio=0.15):
    """Extract a padded square crop from a YOLO-normalized bounding box."""
    import cv2

    img_h, img_w = image.shape[:2]

    cx = x_center * img_w
    cy = y_center * img_h
    bw = w * img_w
    bh = h * img_h

    size = max(bw, bh) * (1 + padding_ratio)

    x1 = max(0, int(cx - size / 2))
    y1 = max(0, int(cy - size / 2))
    x2 = min(img_w, int(cx + size / 2))
    y2 = min(img_h, int(cy + size / 2))

    crop = image[y1:y2, x1:x2]
    if crop.size == 0:
        return None

    crop = cv2.resize(crop, (224, 224), interpolation=cv2.INTER_AREA)
    return crop


def _prepare_split(split: str):
    """Prepare the anomaly classification crops for one split."""
    import cv2

    raw_root = Path(ANOMALY_RAW_DATASET_PATH)
    images_dir = raw_root / split / "images"
    labels_dir = raw_root / split / "labels"
    out_root = Path(STATUS_DATASET_PATH)

    if not labels_dir.exists():
        print(f"Warning: {labels_dir} does not exist. Skipping split {split}.")
        return 0

    out_root.mkdir(parents=True, exist_ok=True)

    # Clean and recreate split output directories for each class
    for cls_idx in range(len(ANOMALY_TOOTH_CLASS_IDS)):
        cls_dir = out_root / split / str(cls_idx)
        if cls_dir.exists():
            shutil.rmtree(cls_dir)
        cls_dir.mkdir(parents=True, exist_ok=True)

    total_crops = 0
    label_files = sorted(labels_dir.glob("*.txt"))

    for lf in label_files:
        # Find the matching image
        img_path = None
        for ext in [".jpg", ".jpeg", ".png"]:
            candidate = images_dir / (lf.stem + ext)
            if candidate.exists():
                img_path = candidate
                break

        if img_path is None:
            print(f"Warning: no image found for label {lf.name}")
            continue

        image = cv2.imread(str(img_path))
        if image is None:
            print(f"Warning: cannot read image {img_path}")
            continue

        with open(lf, "r", encoding="utf-8") as f:
            for obj_idx, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue

                parts = line.split()
                if len(parts) < 5:
                    continue

                original_cls = int(parts[0])
                if original_cls not in ANOMALY_TOOTH_CLASS_IDS:
                    continue

                x_center, y_center, w, h = (float(x) for x in parts[1:5])
                crop = _bbox_crop(image, x_center, y_center, w, h)
                if crop is None:
                    continue

                new_cls = ANOMALY_ORIGINAL_TO_CLASSIFIER[original_cls]
                out_path = out_root / split / str(new_cls) / f"{lf.stem}_{obj_idx}.png"
                cv2.imwrite(str(out_path), crop)
                total_crops += 1

    return total_crops


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    timeout=3600,
)
def prepare_anomaly_status_dataset():
    """
    Build the tooth-related classification dataset from the raw anomaly YOLO dataset.
    """
    stats = {}
    for split in ["train", "valid", "test"]:
        print(f"Processing {split}...")
        count = _prepare_split(split)
        stats[split] = count
        print(f"  {split}: {count} crops")

    volume.commit()
    return {"status": "done", "dataset_path": STATUS_DATASET_PATH, "stats": stats}


@app.local_entrypoint()
def main():
    print("Preparing anomaly classification dataset on Modal...")
    result = prepare_anomaly_status_dataset.remote()
    print(f"Result: {result}")


if __name__ == "__main__":
    app.run()
