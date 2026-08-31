import json
from config import app, dental_image, volume, DATA_DIR
import os
from pathlib import Path

ROOT = f"{DATA_DIR}/dataset/anomaly_raw/YOLO/YOLO"

@app.function(image=dental_image, volumes={"/data": volume}, timeout=300)
def inspect_yolo_dirs_fast():
    root = Path(ROOT)
    if not root.exists():
        return {"error": "not found", "path": ROOT}

    result = {"root": ROOT, "dirs": {}, "label_samples": []}

    for split in ["train", "valid", "test"]:
        d = root / split
        if d.exists():
            images_dir = d / "images"
            labels_dir = d / "labels"
            img_count = 0
            if images_dir.exists():
                img_count = sum(1 for _ in os.scandir(images_dir) if _.is_file())
            lbl_count = 0
            if labels_dir.exists():
                lbl_count = sum(1 for _ in os.scandir(labels_dir) if _.is_file())
            result["dirs"][split] = {"images": img_count, "labels": lbl_count}

            if labels_dir.exists():
                for i, entry in enumerate(os.scandir(labels_dir)):
                    if i >= 5:
                        break
                    with open(entry.path, "r", encoding="utf-8") as f:
                        lines = [line.strip() for line in f if line.strip()]
                    result["label_samples"].append({"file": entry.name, "split": split, "objects": lines})

    return result

@app.local_entrypoint()
def main():
    r = inspect_yolo_dirs_fast.remote()
    print(json.dumps(r, indent=2, default=str))

if __name__ == "__main__":
    app.run()