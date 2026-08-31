import os
import json
from pathlib import Path

from config import app, dental_image, volume, kaggle_secret, DATA_DIR

# Dataset source (Kaggle kernel)
ANOMALY_KERNEL = "lokisilvres/dental-anamoly-detection-of-panoramic-x-ray-images"
ANOMALY_DATA_DIR = f"{DATA_DIR}/dataset/anomaly"


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    secrets=[kaggle_secret],
    timeout=1800,
)
def download_and_explore_anomaly_dataset():
    """
    Download the Kaggle anomaly-detection kernel into the Modal volume
    and explore its structure.
    """
    import subprocess
    import shutil

    _ensure_dir(ANOMALY_DATA_DIR)
    tmp_dir = f"{DATA_DIR}/dataset/anomaly_tmp"
    _ensure_dir(tmp_dir)

    # Try pulling the kernel
    print(f"Pulling Kaggle kernel: {ANOMALY_KERNEL}")
    result = subprocess.run(
        ["kaggle", "kernels", "pull", ANOMALY_KERNEL, "-p", tmp_dir],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"Pull failed: {result.stderr}")
        # Fallback: try downloading kernel output files
        print("Trying to download kernel output files...")
        result = subprocess.run(
            ["kaggle", "kernels", "output", ANOMALY_KERNEL, "-p", tmp_dir],
            capture_output=True,
            text=True,
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"Output download failed: {result.stderr}")
            return {"error": "download_failed"}

    # Move files from tmp to final location
    print(f"Contents of tmp_dir: {os.listdir(tmp_dir)}")
    for item in os.listdir(tmp_dir):
        src = os.path.join(tmp_dir, item)
        dst = os.path.join(ANOMALY_DATA_DIR, item)
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.move(src, dst)
        else:
            shutil.move(src, dst)

    # Explore structure
    report = _explore_directory(ANOMALY_DATA_DIR)
    volume.commit()
    return report


def _ensure_dir(path: str):
    Path(path).mkdir(parents=True, exist_ok=True)


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
                if len(summary["image_samples"]) < 10:
                    summary["image_samples"].append(rel)
            if ext in {".csv", ".json", ".txt"}:
                summary["label_files"].append(rel)
        elif p.is_dir():
            summary["total_dirs"] += 1

    # Inspect image sizes for a few samples
    try:
        from PIL import Image
        for sample in summary["image_samples"][:5]:
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
                content = f.read(2000)
            summary["label_inspection"][label_file] = content
        except Exception as e:
            summary["label_inspection"][label_file] = f"ERROR: {e}"

    return summary


@app.local_entrypoint()
def main():
    result = download_and_explore_anomaly_dataset.remote()
    print("\n=== EXPLORATION REPORT ===")
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    app.run()
