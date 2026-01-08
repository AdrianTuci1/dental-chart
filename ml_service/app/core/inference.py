import torch
import torch.nn as nn
from torchvision import transforms 
from torchvision.transforms import functional as F
from PIL import Image
import numpy as np
from typing import Any, Dict, List, Optional
from app.core.device import get_device

class BaseInferenceModel:
    def __init__(self, weights_path: Optional[str] = None):
        self.device = get_device()
        self.model = self.load_model(weights_path)
        self.model.to(self.device)
        self.model.eval()

    def load_model(self, weights_path: Optional[str]) -> nn.Module:
        """
        Load the specific model architecture and weights.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement load_model")

    def preprocess(self, image_path: str) -> torch.Tensor:
        """
        Read image and convert to tensor.
        """
        image = Image.open(image_path).convert("RGB")
        image_tensor = F.to_tensor(image)
        return image_tensor.to(self.device), image

    def predict(self, image_path: str, confidence_threshold: float = 0.5) -> Dict[str, Any]:
        """
        Run inference.
        """
        raise NotImplementedError("Subclasses must implement predict")
