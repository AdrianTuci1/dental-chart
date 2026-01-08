from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import shutil
import os
import uuid

# Import Services
from app.services.anatomy import AnatomyService
from app.services.pathology import PathologyService
from app.services.fusion import FusionService
from app.core.visualizer import Visualizer

app = FastAPI(title="Dental Chart ML Service")

# Initialize Services
anatomy_service = AnatomyService()
pathology_service = PathologyService()
fusion_service = FusionService()

@app.get("/health")
def read_health():
    return {"status": "ok", "service": "ML Microservice"}

@app.post("/scan")
@app.post("/predict") # Alias for compatibility
async def process_scan(file: UploadFile = File(...)):
    print(f"Received scan: {file.filename}")
    
    # Save file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = f"{temp_dir}/{uuid.uuid4()}_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Saved to {file_path}")
        
        # 1. Inference
        anatomy_results = anatomy_service.predict(file_path)
        pathology_results = pathology_service.predict(file_path)
        
        # 2. Fusion & Mapping
        final_findings = fusion_service.fuse(anatomy_results, pathology_results)
        
        # 3. Visualization (Optional - strictly if requested or for debug)
        # Flatten findings for visualizer logic compatibility if needed
        # but Visualizer.draw_findings takes raw dictionaries.
        # We can reconstruct a simple list for visualization if needed.
        viz_findings = anatomy_results + pathology_results
        # annotated_base64 = Visualizer.draw_findings(file_path, viz_findings)
        
        return {
            "status": "success",
            "filename": file.filename,
            "findings": final_findings,
            # "annotated_image": annotated_base64
        }
        
    except Exception as e:
        print(f"Error processing scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
