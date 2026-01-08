import redis
import json
import time
import os
import requests
import cv2
import numpy as np

# Updated Services
from app.services.anatomy import AnatomyService
from app.services.pathology import PathologyService
from app.services.fusion import FusionService # New Modular Service
from app.core.visualizer import Visualizer

# Configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
QUEUE_NAME = 'scan_tasks'
API_URL = os.getenv('API_URL', 'http://api:3001/api/scans/webhook')
IDLE_TIMEOUT = 15 * 60 # 15 minutes

def run_worker():
    print(f"Starting Multi-Model ML Worker. Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
    
    # Initialize Services
    anatomy_service = AnatomyService()
    pathology_service = PathologyService()
    fusion_service = FusionService()
    
    last_job_time = time.time()

    while True:
        if time.time() - last_job_time > IDLE_TIMEOUT:
            print("Idle timeout reached. Shutting down worker...")
            break

        task = r.blpop(QUEUE_NAME, timeout=5)
        
        if task:
            last_job_time = time.time()
            _, data = task
            job = json.loads(data)
            
            print(f"Processing Job: {job}")
            scan_id = job.get('scanId')
            file_url = job.get('fileUrl')
            
            try:
                # 1. Inference
                anatomy_results = anatomy_service.predict(file_url)     # Teeth
                pathology_results = pathology_service.predict(file_url) # Diseases
                
                # 2. Fusion Logic (Delegated to Service)
                final_findings = fusion_service.fuse(anatomy_results, pathology_results)
                
                print(f"Mapped {len(final_findings)} findings.")

                # 3. Visualization
                # Flatten findings for visualizer (Anatomy + Pathology raw boxes)
                viz_findings = anatomy_results + pathology_results
                annotated_base64 = Visualizer.draw_findings(file_url, viz_findings)
                
                # 4. Callback
                payload = {
                    "scanId": scan_id,
                    "status": "COMPLETED",
                    "findings": final_findings,
                    "annotatedImage": annotated_base64 
                }
                requests.post(API_URL, json=payload)
                print(f"Job {scan_id} Completed. Callback sent.")
                
            except Exception as e:
                print(f"Job Failed: {e}")
                requests.post(API_URL, json={"scanId": scan_id, "status": "FAILED", "error": str(e)})
        else:
            pass

if __name__ == "__main__":
    run_worker()
