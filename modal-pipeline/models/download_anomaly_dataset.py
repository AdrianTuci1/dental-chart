import os
import json
from pathlib import Path

from config import app, dental_image, volume, kaggle_secret, DATA_DIR

ANOMALY_DATASET = "lokisilvres/dental-disease-panoramic-detection-dataset"
ANOMALY_DATA_DIR = f"{DATA_DIR}/dataset/anomaly_raw"


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    secrets=[kaggle_secret],
    timeout=1800,
)
def download_and_explore_dataset():
    """Download the actual Kaggle dataset and explore its structure."""
    import subprocess

    Path(ANOMALY_DATA_DIR).mkdir(parents=True, exist_ok=True)

    print(f"Downloading dataset: {ANOMALY_DATASET}")
    result = subprocess.run(
        ["kaggle", "datasets", "download", ANOMALY_DATASET, "-p", ANOMALY_DATA_DIR, "--unzip", "--force"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"Download failed: {result.stderr}")
        return {"error": "dataset_download_failed", "stderr": result.stderr}

    report = _explore_directory(ANOMALY_DATA_DIR)
    volume.commit()
    return report


def _explore_directory(root: str):
    """Recursively explore directory and return a summary."""
    root_path = Path(root)
    summary = {
        "root": root,
        "total_files": 0,
        "total_dirs": 0,
        "extensions": {},
        "tree": [],
        "image_samples": [],
        "label_files": [],
    }

    for p in root_path.rglob("*"):
        if p.is_file():
            summary["total_files"] += 1
            ext = p.suffix.lower()
            summary["extensions"][ext] = summary["extensions"].get(ext, 0) + 1
            rel = str(p.relative_to(root_path))
            summary["tree"].append(rel)
            if ext in {".png", ".jpg", ".jpeg"}:
                if len(summary["image_samples"]) < 100:
                    summary["image_samples"].append(rel)
            if ext in {".csv", ".json", ".txt", ".yaml", ".yml"}:
                summary["label_files"].append(rel)
        elif p.is_dir():
            summary["total_dirs"] += 1

    # Inspect image sizes
    try:
        from PIL import Image
        for sample in summary["image_samples"][:10]:
            img_path = root_path / sample
            with Image.open(img_path) as img:
                summary.setdefault("image_sizes", []).append(
                    {"path": sample, "size": img.size, "mode": img.mode}
                )
    except Exception as e:
        summary["image_size_error"] = str(e)

    # Inspect label files
    summary["label_inspection"] = {}
    for label_file in summary["label_files"]:
        try:
            label_path = root_path / label_file
            with open(label_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(10000)
            summary["label_inspection"][label_file] = content
        except Exception as e:
            summary["label_inspection"][label_file] = f"ERROR: {e}"

    return summary


@app.local_entrypoint()
def main():
    result = download_and_explore_dataset.remote()
    print("\n=== DATASET EXPLORATION REPORT ===")
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    app.run()
