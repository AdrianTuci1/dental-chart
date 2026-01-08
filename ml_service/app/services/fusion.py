import numpy as np
import cv2

class FusionService:
    """
    FusionService is responsible for:
    1. Combining Anatomy (Teeth) and Pathology (Disease) detections.
    2. Calculating relative overlap (IoU) and Zonal Analysis.
    3. Constructing the final structured JSON payload for the dental chart.
    """

    def box_iou(self, boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        
        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        
        iou = interArea / float(boxAArea + boxBArea - interArea)
        return iou

    def calculate_rotation_angle(self, mask_contour):
        if not mask_contour or len(mask_contour) < 5:
            return 0.0
        try:
            points = np.array(mask_contour, dtype=np.float32)
            if len(points) >= 5:
                (x, y), (MA, ma), angle = cv2.fitEllipse(points)
                # Normalize: 0 is vertical upright
                rotation = angle
                if rotation > 90:
                    rotation -= 180
                return rotation
        except Exception:
            return 0.0
        return 0.0

    def get_surface_from_overlap(self, tooth_box, pathology_box, iso_number):
        tx1, ty1, tx2, ty2 = tooth_box
        px1, py1, px2, py2 = pathology_box
        
        # Relative center
        pcx = (px1 + px2) / 2
        pcy = (py1 + py2) / 2
        
        tw = tx2 - tx1
        th = ty2 - ty1
        
        rel_x = (pcx - tx1) / tw
        rel_y = (pcy - ty1) / th
        
        surfaces = []
        is_maxilla = (11 <= iso_number <= 28)
        
        # Vertical Zones
        if is_maxilla: # Roots UP
            if rel_y < 0.4: surfaces.append("Root")
            elif rel_y > 0.7: surfaces.append("Occlusal")
            else: surfaces.append("Cervical")
        else: # Roots DOWN
            if rel_y < 0.3: surfaces.append("Occlusal")
            elif rel_y > 0.6: surfaces.append("Root")
            else: surfaces.append("Cervical")
            
        # Horizontal Zones
        quadrant = iso_number // 10
        is_mesial_left = (quadrant == 1 or quadrant == 4)
        
        if rel_x < 0.33:
            surfaces.append("Mesial" if is_mesial_left else "Distal")
        elif rel_x > 0.66:
            surfaces.append("Distal" if is_mesial_left else "Mesial")
            
        return surfaces

    def fuse(self, anatomy_results, pathology_results):
        final_findings = []
        
        # 1. Process Anatomy (Background Layer)
        for tooth in anatomy_results:
            rotation = 0.0
            if tooth.get('mask_contour'):
                rotation = self.calculate_rotation_angle(tooth.get('mask_contour'))

            final_findings.append({
                "type": "Anatomy",
                "label": f"Tooth {tooth.get('sub_label')}",
                "box": tooth.get('box'),
                "mask_contour": tooth.get('mask_contour'),
                "isoNumber": int(tooth.get('sub_label')),
                "rotation": rotation,
                "ml_metadata": { "rotation_deg": rotation }
            })
            
        # 2. Process Pathology (Overlay Layer)
        for path in pathology_results:
            best_tooth = None
            max_iou = 0.0
            path_box = path.get('box')
            
            if path_box:
                for tooth in anatomy_results:
                    tooth_box = tooth.get('box')
                    if tooth_box:
                        iou = self.box_iou(path_box, tooth_box)
                        if iou > max_iou:
                            max_iou = iou
                            best_tooth = tooth
            
            # Construct Payload
            if best_tooth and max_iou > 0.01:
                iso = int(best_tooth.get('sub_label'))
                zones = self.get_surface_from_overlap(best_tooth.get('box'), path_box, iso)
                label = path.get('label').lower()
                
                tooth_update = { "isoNumber": iso }
                
                # Logic Switch
                if "caries" in label or "decay" in label:
                    tooth_update["pathology"] = { "decay": [{ "type": "Dentin", "zones": zones }] }
                elif "filling" in label:
                    tooth_update["restoration"] = { "fillings": [{ "zones": zones, "material": "Composite", "quality": "Sufficient" }] }
                elif "crown" in label:
                    tooth_update["restoration"] = { "crowns": [{ "type": "Single", "material": "Ceramic", "base": "Natural", "quality": "Sufficient" }] }
                elif "implant" in label:
                    tooth_update["restoration"] = { "crowns": [{ "type": "Single", "material": "Ceramic", "base": "Implant", "quality": "Sufficient" }] }
                elif "fracture" in label:
                    tooth_update["pathology"] = { "fracture": { "crown": True } }
                elif "root_fragment" in label:
                     tooth_update["toBeExtracted"] = True
                     tooth_update["pathology"] = { "developmentDisorder": True }
                elif "apical" in label or "pulpitis" in label:
                    tooth_update["pathology"] = { "apicalPathology": True }
                elif "tartar" in label:
                    tooth_update["periodontal"] = { "sites": { "buccal": { "tartar": True } } }
                elif "bone_loss" in label:
                    tooth_update["periodontal"] = { "furcation": "Stage 2" }
                elif "impacted" in label or "supernumerary" in label:
                    tooth_update["pathology"] = { "developmentDisorder": True }
                elif "missing" in label:
                    tooth_update["isMissing"] = True
                elif "enamel" in label:
                    tooth_update["pathology"] = { "toothWear": { "type": "Erosion", "surface": "Buccal" } }

                # ML Metadata
                tooth_update["ml_metadata"] = {
                    "label": path.get('label'),
                    "confidence": path.get('score'),
                    "original_box": path.get('box')
                }
                
                final_findings.append(tooth_update)
                
        return final_findings
