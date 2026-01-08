from typing import Any, Dict, List
import torch
import os
from torchvision.models.detection import maskrcnn_resnet50_fpn
# could use fasterrcnn_resnet50_fpn if only boxes are needed
# but Mask R-CNN gives boxes too, so we keep uniformity

from app.core.inference import BaseInferenceModel

class PathologyService(BaseInferenceModel):
    def __init__(self, weights_path=None):
        super().__init__(weights_path)
        # Mapping from Kaggle dataset classes

        # Mapping from expanded dataset classes
        self.class_map = {
            1: "Caries",              # Maps to Pathology.decay
            2: "Apical Pathology",    # Maps to Pathology.apicalPathology
            3: "Pulpitis",            # Maps to Pathology/Endo (Contextual)
            4: "filling",             # Maps to Restoration.fillings
            5: "crown",               # Maps to Restoration.crowns
            6: "implant",             # Maps to Restoration.crowns (base=Implant)
            7: "root_fragment",       # Maps to ToBeExtracted or Fracture
            8: "fracture",            # Maps to Pathology.fracture
            9: "tartar",              # Maps to Periodontal.sites.tartar
            10: "bone_loss",          # Maps to Periodontal.furcation or recession
            11: "supernumerary",      # Maps to Pathology.developmentDisorder
            12: "impacted",           # Maps to Pathology.developmentDisorder
            13: "missing",            # Maps to isMissing=True
            14: "enamel_defect"       # Maps to Pathology.toothWear or Discoloration
        }

    def load_model(self, weights_path=None):
        # 1. Define Architecture matching Training (15 Classes)
        num_classes = 15
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
            print(f"Loading Pathology weights from {weights_path}")
            state_dict = torch.load(weights_path, map_location=self.device)
            model.load_state_dict(state_dict)
        else:
            print("Warning: No Pathology weights found. Using random init (will not detect diseases).")

        return model

    def predict(self, image_path: str, confidence_threshold=0.5) -> List[Dict[str, Any]]:
        print(f"PathologyService: Analyzing {image_path}...")
        image_tensor, _ = self.preprocess(image_path)
        
        with torch.no_grad():
            prediction = self.model([image_tensor])[0]

        scores = prediction['scores'].cpu().numpy()
        labels = prediction['labels'].cpu().numpy()
        boxes = prediction['boxes'].cpu().numpy()
        
        # If model outputs masks
        masks = None
        if 'masks' in prediction:
            masks = prediction['masks'].cpu().numpy()
        
        results = []
        for i, score in enumerate(scores):
            if score > confidence_threshold:
                class_id = int(labels[i])
                label_name = self.class_map.get(class_id, "Unknown")
                
                finding = {
                    "label": label_name,
                    "score": float(score),
                    "box": boxes[i].tolist()
                }
                
                # If we have masks
                if masks is not None:
                     mask = masks[i, 0]
                     # logical processing...
                
                results.append(finding)
        
        return results
