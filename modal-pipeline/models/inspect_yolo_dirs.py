import json
from config import app, dental_image, volume, DATA_DIR
import os
from pathlib import Path

ROOT = f"{DATA_DIR}/dataset/anomaly_raw/YOLO/YOLO"

@app.function(image=dental_image, volumes={"/data": volume}, timeout=300)
def inspect_yolo_dirs():
    root = Path(ROOT)
    if not root.exists():
        return {"error": "not found", "path": ROOT}

    result = {"root": ROOT, "dirs": {}, "label_samples": [], "label_counts": {}}

    for split in ["train", "valid", "test", "labels"]:
        d = root / split
        if d.exists():
            images_dir = d / "images"
            labels_dir = d / "labels"
            result["dirs"][split] = {
                "images": len(list(images_dir.glob("*"))) if images_dir.exists() else 0,
                "labels": len(list(labels_dir.glob("*"))) if labels_dir.exists() else 0,
            }

            # Count classes in labels
            if labels_dir.exists():
                for lf in labels_dir.glob("*.txt"):
                    with open(lf, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                cls = int(line.split()[0])
                                key = f"{split}_{cls}"
                                result["label_counts"][key] = result["label_counts"].get(key, 0) + 1

                # Read a few sample labels
                for lf in sorted(labels_dir.glob("*.txt"))[:5]:
                    with open(lf, "r", encoding="utf-8") as f:
                        lines = [line.strip() for line in f if line.strip()]
                    result["label_samples"].append({"file": lf.name, "split": split, "objects": lines})

    return result

@app.local_entrypoint()
def main():
    r = inspect_yolo_dirs.remote()
    print(json.dumps(r, indent=2, default=str))

if __name__ == "__main__":
    app.run()