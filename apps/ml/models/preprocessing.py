import cv2
import numpy as np

# ==============================================================================
# DENTAL IMAGE PREPROCESSING
# ==============================================================================
# Implements the techniques mentioned in the research paper:
# 1. Brightness adjustment
# 2. Noise removal (Median Blur)
# 3. Local contrast (CLAHE)
# 4. Normalization

def preprocess_for_inference(image, target_size=(640, 640)):
    """
    Resize the image to target_size (squash to square)
    and apply contrast enhancement.
    """
    # 1. Resize (squash)
    img_640 = cv2.resize(image, target_size, interpolation=cv2.INTER_AREA)
    
    # 2. Convert to grayscale for enhancement
    if len(img_640.shape) == 3:
        gray = cv2.cvtColor(img_640, cv2.COLOR_BGR2GRAY)
    else:
        gray = img_640

    # 3. Apply transformations (Brightness, Median Blur, CLAHE)
    brightened = cv2.convertScaleAbs(gray, alpha=1.5, beta=15)
    denoised = cv2.medianBlur(brightened, 3)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(3, 3))
    enhanced = clahe.apply(denoised)

    # Reconvert to 3 channels for YOLO
    result = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    return result

def apply_dental_enhancement(image):
    """
    Apply the STRICT transformations from the research paper (Table I):
    1. Brightness Adjustment: I' = 1.5 * I + 15
    2. Median Blur: k=3
    3. CLAHE: clipLimit=2.0, tileGridSize=(3,3)
    """
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # 1. Brightness adjustment (alpha=1.5, beta=15)
    brightened = cv2.convertScaleAbs(gray, alpha=1.5, beta=15)

    # 2. Noise removal (Median Blur k=3)
    denoised = cv2.medianBlur(brightened, 3)

    # 3. CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(3, 3))
    enhanced = clahe.apply(denoised)

    # Reconvert to 3 channels for YOLO
    result = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    return result

def normalize_image(image):
    """Normalize pixel values to [0, 1]."""
    return image.astype(np.float32) / 255.0
