import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import io
import base64

class Visualizer:
    @staticmethod
    def draw_findings(image_path: str, findings: list, output_path: str = None) -> str:
        """
        Draws bounding boxes and masks on the image.
        Returns base64 encoded string of the annotated image.
        """
        # Load image
        image = cv2.imread(image_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Create separate overlay for transparency
        overlay = image.copy()
        
        # Colors for different classes (BGR format for OpenCV usually, but we converted to RGB)
        # We will use RGB colors
        colors = {
            "Tooth": (0, 255, 0),       # Green
            "Caries": (255, 0, 0),      # Red
            "Pulpitis": (255, 165, 0),  # Orange
            "Deep Sulcus": (255, 255, 0), # Yellow
            "Abnormal": (128, 0, 128),  # Purple
            "Other": (0, 0, 255)        # Blue
        }
        
        for finding in findings:
            label = finding.get('label', 'Ref')
            score = finding.get('score', 1.0)
            box = finding.get('box') # [x1, y1, x2, y2]
            mask_points = finding.get('mask_contour') # [[x,y], [x,y]]
            
            color = colors.get(label, (255, 255, 255))
            
            # Map specific pathologies to colors if 'label' is generic
            # logic to map specific subclass
            
            # Draw Mask
            if mask_points and len(mask_points) > 0:
                pts = np.array(mask_points, np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.fillPoly(overlay, [pts], color)
                
            # Draw Box
            if box:
                x1, y1, x2, y2 = map(int, box)
                cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
                
                # Text
                text = f"{label} {score:.2f}"
                cv2.putText(image, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Apply transparency
        alpha = 0.4
        cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)
        
        # Save or return
        if output_path:
             # Convert back to BGR for saving with cv2
             cv2.imwrite(output_path, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
             
        # Convert to base64
        pil_img = Image.fromarray(image)
        buff = io.BytesIO()
        pil_img.save(buff, format="JPEG")
        return base64.b64encode(buff.getvalue()).decode("utf-8")
