import json
from config import app, dental_image, volume, DATA_DIR
import os
from pathlib import Path

ROOT = f"{DATA_DIR}/dataset/anomaly_raw"

@app.function(image=dental_image, volumes={"/data": volume}, timeout=300)
def list_anomaly_dataset():
    if not os.path.exists(ROOT):
        return {"error": "directory not found", "path": ROOT}

    result = {"root": ROOT, "tree": [], "extensions": {}}
    for p in Path(ROOT).rglob("*"):
        if p.is_file():
            rel = str(p.relative_to(ROOT))
            result["tree"].append(rel)
            ext = p.suffix.lower()
            result["extensions"][ext] = result["extensions"].get(ext, 0) + 1
        elif p.is_dir():
            rel = str(p.relative_to(ROOT))
            result["tree"].append(rel + "/")

    return result

@app.local_entrypoint()
def main():
    r = list_anomaly_dataset.remote()
    print(json.dumps(r, indent=2, default=str))

if __name__ == "__main__":
    app.run()