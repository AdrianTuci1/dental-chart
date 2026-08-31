import json
from config import app, dental_image, volume, DATA_DIR

NOTEBOOK_PATH = f"{DATA_DIR}/dataset/anomaly/dental-anamoly-detection-of-panoramic-x-ray-images.ipynb"


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    timeout=300,
)
def inspect_notebook():
    """Read the downloaded notebook and extract cells that mention datasets or URLs."""
    with open(NOTEBOOK_PATH, "r", encoding="utf-8") as f:
        nb = json.load(f)

    cells = []
    for i, cell in enumerate(nb.get("cells", [])):
        source = "".join(cell.get("source", []))
        # Keep cells that mention dataset, URL, kaggle, path, download, or add_data
        lowered = source.lower()
        if any(
            k in lowered
            for k in [
                "dataset",
                "kaggle",
                "download",
                "http",
                "path",
                "add_data",
                "input",
                "output",
                "class",
                "label",
            ]
        ):
            cells.append({"index": i, "type": cell.get("cell_type"), "source": source})

    return {"total_cells": len(nb.get("cells", [])), "relevant_cells": cells}


@app.local_entrypoint()
def main():
    result = inspect_notebook.remote()
    print(f"Total cells: {result['total_cells']}")
    print("\n=== RELEVANT CELLS ===")
    for cell in result["relevant_cells"]:
        print(f"\n--- Cell {cell['index']} ({cell['type']}) ---")
        print(cell["source"][:2000])


if __name__ == "__main__":
    app.run()
