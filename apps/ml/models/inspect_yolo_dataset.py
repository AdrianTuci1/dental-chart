import json
from config import app, dental_image, volume, DATA_DIR

ROOT = f"{DATA_DIR}/dataset/anomaly_raw"

@app.function(image=dental_image, volumes={"/data": volume}, timeout=300)
def inspect_yolo_dataset():
    from pathlib import Path
    import yaml

    yolo_root = Path(ROOT) / "YOLO" / "YOLO"
    data_yaml = yolo_root / "data.yaml"

    result = {"data_yaml_exists": data_yaml.exists(), "classes": [], "labels": []}

    if data_yaml.exists():
        with open(data_yaml, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        result["data_yaml"] = data
        result["classes"] = data.get("names", [])

    # Read a few label files
    labels_dir = yolo_root / "labels"
    if labels_dir.exists():
        label_files = sorted(labels_dir.glob("*.txt"))[:20]
        for lf in label_files:
            with open(lf, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            result["labels"].append({
                "file": lf.name,
                "objects": lines,
                "count": len(lines)
            })

    # Count images per class (from first 1000 labels to be quick)
    class_counts = {}
    if labels_dir.exists():
        for lf in labels_dir.glob("*.txt"):
            with open(lf, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        cls = int(line.split()[0])
                        class_counts[cls] = class_counts.get(cls, 0) + 1

    result["class_counts"] = class_counts
    return result

@app.local_entrypoint()
def main():
    r = inspect_yolo_dataset.remote()
    print(json.dumps(r, indent=2, default=str))

if __name__ == "__main__":
    app.run()
