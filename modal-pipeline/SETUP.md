# 🛠️ Setup

This guide covers the one-time setup required to run the dental-chart Modal pipeline.

## 1. Install the Modal CLI

The pipeline runs on the Modal cloud platform. Install the CLI locally:

```bash
pipx install modal
pipx ensurepath
```

Verify the installation:

```bash
modal --version
```

## 2. Authenticate with Modal

Log in to your Modal account from the terminal:

```bash
modal login
```

This opens a browser window and stores your credentials locally.

## 3. Create the Kaggle secret

Dataset download uses the Kaggle API. Create a Modal secret named `kaggle-creds` with your username and API key:

```bash
modal secret create kaggle-creds KAGGLE_USERNAME=<username> KAGGLE_KEY=<key>
```

You can obtain your Kaggle API key from [kaggle.com/settings](https://www.kaggle.com/settings).

## 4. Verify the project layout

The pipeline code lives in `modal-pipeline/models/`:

- `config.py` – shared image, volume, secrets and class definitions
- `data_preparation.py` – downloads and prepares the dataset
- `train.py` – trains YOLO11-seg for FDI segmentation and numbering
- `train_status.py` – trains ResNet18 for clinical status classification
- `inference.py` – runs inference with the trained models and heuristic correction

## 5. Next steps

After setup is complete, follow the commands in [`README.md`](README.md) to prepare the dataset, train the models and run inference.
