from typing import Any, Dict, List
import torch
import numpy as np
import cv2
import os
from torchvision.models.detection import maskrcnn_resnet50_fpn

from app.core.inference import BaseInferenceModel

class AnatomyService(BaseInferenceModel):
    def load_model(self, weights_path=None):
        # 1. Define Architecture matching Training (33 Classes)
        num_classes = 33 
        model = maskrcnn_resnet50_fpn(pretrained=False, progress=False)
        
        # Replace Head for Custom Classes
        from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
        from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor
        
        in_features = model.roi_heads.box_predictor.cls_score.in_features
        model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
        
        in_features_mask = model.roi_heads.mask_predictor.conv5_mask.in_channels
        hidden_layer = 256
        model.roi_heads.mask_predictor = MaskRCNNPredictor(in_features_mask, hidden_layer, num_classes)
        
        # 2. Load Weights if provided
        if weights_path and os.path.exists(weights_path):
            print(f"Loading Anatomy weights from {weights_path}")
            state_dict = torch.load(weights_path, map_location=self.device)
            model.load_state_dict(state_dict)
        else:
            print("Warning: No Anatomy weights found. Using random init (will not detect teeth).")
            
        return model

    def predict(self, image_path: str, confidence_threshold=0.5) -> List[Dict[str, Any]]:
        print(f"AnatomyService: Analyzing {image_path}...")
        image_tensor, original_image = self.preprocess(image_path)
        
        with torch.no_grad():
            prediction = self.model([image_tensor])[0]

        masks = prediction['masks'].cpu().numpy()
        scores = prediction['scores'].cpu().numpy()
        boxes = prediction['boxes'].cpu().numpy()
        
        results = []
        for i, score in enumerate(scores):
            if score > confidence_threshold:
                # Identify Tooth ISO Number from Class ID
                # Assumption: Model trained with classes 1-32 mapping to ISO 11-48
                # 1-8 -> 18-11 (UR), 9-16 -> 21-28 (UL), etc. 
                # OR simple direct mapping if dataset allows.
                # Here we define a standard mapping:
                
                class_id = int(prediction['labels'][i])
                
                # MOCK MAPPING (You must align this with your Dataset's labels!)
                # Example: Class 1=18, Class 2=17, ... Class 16=28
                # For safety/demo, we assume direct map or use a helper
                iso_map = {
                    1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
                    9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
                    17: 38, 18: 37, 19: 36, 20: 35, 21: 34, 22: 33, 23: 32, 24: 31,
                    25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48
                }
                
                tooth_num = iso_map.get(class_id, 0)
                
                mask = masks[i, 0]
                mask_binary = (mask > 0.5).astype(np.uint8) * 255
                contours, _ = cv2.findContours(mask_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contour_points = []
                if contours:
                    c = max(contours, key=cv2.contourArea)
                    contour_points = c.tolist()

                results.append({
                    "label": "Tooth",
                    "sub_label": str(tooth_num), # Specific tooth ID
                    "score": float(score),
                    "box": boxes[i].tolist(),
                    "mask_contour": contour_points
                })
        
        return results
