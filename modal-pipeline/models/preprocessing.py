import cv2
import numpy as np

# ==============================================================================
# PREPROCESARE IMAGINI DENTARE
# ==============================================================================
# Implementăm tehnicile menționate în lucrarea de cercetare:
# 1. Ajustarea luminozității
# 2. Eliminarea zgomotului (Median Blur)
# 3. Contrast local (CLAHE)
# 4. Normalizare

def apply_dental_enhancement(image):
    """
    Aplică transformările STRICTE din lucrarea de cercetare (Tabelul I):
    1. Brightness Adjustment: I' = 1.5 * I + 15
    2. Median Blur: k=3
    3. CLAHE: clipLimit=2.0, tileGridSize=(3,3)
    """
    # Convertim în grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # 1. Ajustare Luminozitate (alpha=1.5, beta=15)
    # Folosim convertScaleAbs pentru a evita overflow-ul la 255
    brightened = cv2.convertScaleAbs(gray, alpha=1.5, beta=15)

    # 2. Eliminare zgomot (Median Blur k=3)
    denoised = cv2.medianBlur(brightened, 3)

    # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    # Lucrarea folosește un grid foarte mic (3x3) pentru detalii fine
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(3, 3))
    enhanced = clahe.apply(denoised)

    # Reconvertim în 3 canale pentru YOLO (BGR)
    result = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    return result

def normalize_image(image):
    """Normalizează valorile pixelilor în intervalul [0, 1]"""
    return image.astype(np.float32) / 255.0
