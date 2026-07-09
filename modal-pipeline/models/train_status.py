import os
from pathlib import Path

import modal

from config import app, dental_image, volume, STATUS_DATASET_PATH, MODELS_DIR

# ==============================================================================
# STATUS CLASSIFIER TRAINING
# ==============================================================================
# Trains a CNN (ResNet18) on masked tooth crops to predict the clinical status:
# 0=normal, 1=filling, 2=RCT, 3=crown, 4=caries, 5=residual root, 6=RCT+crown.

STATUS_MODEL_DIR = f"{MODELS_DIR}/dental_status_classifier"
NUM_CLASSES = 7


class InMemoryImageDataset:
    """
    Loads all images into RAM once before training starts.
    This avoids repeated reads from the Modal volume during epochs.
    """
    def __init__(self, root, transform=None):
        import torchvision.datasets as datasets
        from PIL import Image

        self.transform = transform
        self.samples = []
        self.targets = []

        # Use ImageFolder to get class ordering and samples list
        folder = datasets.ImageFolder(root)
        print(f"Loading {len(folder)} images into memory from {root}...")
        for path, label in folder.samples:
            try:
                img = Image.open(path).convert("RGB")
                self.samples.append(img)
                self.targets.append(label)
            except Exception as e:
                print(f"Warning: cannot load {path}: {e}")
        print(f"Loaded {len(self.samples)} images into memory.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img = self.samples[idx]
        label = self.targets[idx]
        if self.transform:
            img = self.transform(img)
        return img, label


@app.function(
    image=dental_image,
    volumes={"/data": volume},
    gpu="L40S",
    timeout=14400,
)
def train_status(
    epochs: int = 30,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    resume: bool = False,
):
    """
    Train the tooth status classifier on masked tooth crops.
    Saves the best model during training and the final checkpoint at the end.
    Use resume=true to continue training from the last checkpoint.
    """
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader
    from torchvision import models, transforms

    print("Loading PyTorch dependencies...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    print(f"Dataset path: {STATUS_DATASET_PATH}")

    if not os.path.exists(STATUS_DATASET_PATH):
        raise RuntimeError(f"Status dataset not found at {STATUS_DATASET_PATH}. Run data_preparation.py first.")

    data_transforms = {
        "train": transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]),
        "val": transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]),
    }

    print("Building in-memory datasets...")
    image_datasets = {
        x: InMemoryImageDataset(os.path.join(STATUS_DATASET_PATH, x), data_transforms[x])
        for x in ["train", "val"]
    }
    print(f"Dataset sizes: train={len(image_datasets['train'])}, val={len(image_datasets['val'])}")

    print("Building DataLoaders...")
    dataloaders = {
        x: DataLoader(
            image_datasets[x],
            batch_size=batch_size,
            shuffle=(x == "train"),
            num_workers=0,  # data is already in memory, no need for workers
            pin_memory=True if device.type == "cuda" else False,
        )
        for x in ["train", "val"]
    }

    class_counts = [0] * NUM_CLASSES
    for label in image_datasets["train"].targets:
        class_counts[label] += 1
    print(f"Class counts (train): {class_counts}")

    total = sum(class_counts)
    class_weights = torch.tensor([total / (NUM_CLASSES * c) if c > 0 else 1.0 for c in class_counts]).to(device)

    print("Loading ResNet18 model...")
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, NUM_CLASSES)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)

    start_epoch = 0
    best_acc = 0.0
    Path(STATUS_MODEL_DIR).mkdir(parents=True, exist_ok=True)
    best_model_path = os.path.join(STATUS_MODEL_DIR, "best_status_classifier.pth")
    last_checkpoint_path = os.path.join(STATUS_MODEL_DIR, "last_checkpoint.pth")

    if resume and os.path.exists(last_checkpoint_path):
        print(f"Resuming from checkpoint: {last_checkpoint_path}")
        checkpoint = torch.load(last_checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        scheduler.load_state_dict(checkpoint["scheduler_state_dict"])
        start_epoch = checkpoint.get("epoch", 0)
        best_acc = checkpoint.get("best_acc", 0.0)
        print(f"Resumed from epoch {start_epoch}, best_acc={best_acc:.4f}")

    print(f"Starting training from epoch {start_epoch + 1} for {epochs} epochs...")
    for epoch in range(start_epoch, start_epoch + epochs):
        for phase in ["train", "val"]:
            if phase == "train":
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0
            total_samples = 0

            for batch_idx, (inputs, labels) in enumerate(dataloaders[phase]):
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()
                with torch.set_grad_enabled(phase == "train"):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == "train":
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
                total_samples += labels.size(0)

            epoch_loss = running_loss / total_samples
            epoch_acc = running_corrects.double() / total_samples
            print(f"Epoch {epoch+1}/{start_epoch + epochs} [{phase}] Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

            if phase == "val" and epoch_acc > best_acc:
                best_acc = epoch_acc
                torch.save(model.state_dict(), best_model_path)
                volume.commit()
                print(f"Best model saved with val acc {best_acc:.4f}")

        scheduler.step()

    # Save final checkpoint at the end of the run for potential resume
    torch.save({
        "epoch": start_epoch + epochs,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "scheduler_state_dict": scheduler.state_dict(),
        "best_acc": best_acc,
    }, last_checkpoint_path)
    volume.commit()
    print(f"Final checkpoint saved at epoch {start_epoch + epochs}")

    print(f"Training complete. Best val accuracy: {best_acc:.4f}")
    print(f"Best model saved at: {best_model_path}")
    print(f"Last checkpoint saved at: {last_checkpoint_path}")

    return {
        "best_val_acc": float(best_acc),
        "model_path": best_model_path,
    }


@app.local_entrypoint()
def main(
    epochs: int = 30,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    resume: bool = False,
):
    print("Starting status classifier training in the cloud...")
    result = train_status.remote(
        epochs=epochs,
        batch_size=batch_size,
        learning_rate=learning_rate,
        resume=resume,
    )
    print(f"Result: {result}")


if __name__ == "__main__":
    app.run()
