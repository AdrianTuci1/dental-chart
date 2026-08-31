import json
from config import app, dental_image, volume, DATA_DIR
import os
from pathlib import Path
from collections import Counter

ROOT = f"{DATA_DIR}/dataset/anomaly_raw"

@app.function(image=dental_image, volumes={"/data": volume}, timeout=300)
def summarize_anomaly_dataset():
    if not os.path.exists(ROOT):
        return {"error": "directory not found", "path": ROOT}

    root = Path(ROOT)
    top_dirs = [d for d in root.iterdir() if d.is_dir()]
    top_files = [f for f in root.iterdir() if f.is_file()]

    summary = {
        "root": ROOT,
        "top_level_files": [f.name for f in top_files],
        "top_level_dirs": [],
        "total_files": 0,
        "extensions": Counter(),
    }

    for d in top_dirs:
        dir_info = {"name": d.name, "subdirs": [], "file_count": 0, "extensions": Counter()}
        for sub in d.iterdir():
            if sub.is_dir():
                count = sum(1 for _ in sub.rglob("*") if _.is_file())
                ext_count = Counter()
                for f in sub.rglob("*"):
                    if f.is_file():
                        ext_count[f.suffix.lower()] += 1
                        summary["extensions"][f.suffix.lower()] += 1
                dir_info["subdirs"].append({"name": sub.name, "file_count": count, "extensions": dict(ext_count)})
                dir_info["file_count"] += count
                summary["total_files"] += count
            elif sub.is_file():
                dir_info["file_count"] += 1
                summary["total_files"] += 1
                dir_info["extensions"][sub.suffix.lower()] += 1
                summary["extensions"][sub.suffix.lower()] += 1
        summary["top_level_dirs"].append(dir_info)

    summary["extensions"] = dict(summary["extensions"])
    return summary

@app.local_entrypoint()
def main():
    r = summarize_anomaly_dataset.remote()
    print(json.dumps(r, indent=2, default=str))

if __name__ == "__main__":
    app.run()
