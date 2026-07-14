# 🧬 Training Report: Dental Tooth Segmentation and Numbering

This report documents the methodology and results of the deep learning pipeline for automatic tooth detection, segmentation, FDI numbering and clinical status classification in panoramic dental radiographs.

## Overview

Panoramic radiographs are widely used in dentistry because they show the entire dentition with low radiation dose and minimal patient load. Analyzing these images manually is time-consuming and error-prone. The proposed pipeline combines a YOLO11-seg instance-segmentation model with a three-step heuristic post-processing algorithm and a ResNet18 status classifier to detect, segment, number and classify teeth automatically.

![Pipeline overview](./assets/overview.jpg)

## Dataset

The model is trained on the Kaggle dataset `zwbzwb12341234/a-dual-labeled-dataset`. The dataset contains panoramic dental radiographs annotated with tooth contours and FDI numbers by dental specialists.

- **Input format**: images in `images1/` and Labelme JSON labels in `labels/`.
- **FDI labels**: 33 classes (11–48 permanent teeth plus 91 for supernumerary teeth).
- **Status labels**: 7 clinical categories extracted from the `group_id` field of each annotation.
- **Splits**: 80% train, 10% validation, 10% test.

## Model Architecture

The system uses a two-stage architecture for detection and segmentation, followed by a classifier for status prediction.

1. **YOLO11-seg** – performs instance segmentation, bounding-box detection and FDI classification in a single pass. The model outputs a segmentation mask, a bounding box and an FDI label for each tooth.
2. **Heuristic post-processing** – corrects FDI numbering errors using the spatial ordering of teeth and the expected FDI sequence.
3. **ResNet18** – classifies the clinical status of each tooth from the masked crop produced by the segmentation step.

![Model architecture](./assets/model.jpg)

## Heuristic Algorithm

A three-step heuristic post-processing algorithm is applied to the raw YOLO11-seg outputs to improve FDI numbering accuracy.

1. **Overlap suppression**: when the same physical tooth is predicted with multiple FDI labels, only the highest-confidence prediction is kept.
2. **Jaw splitting and sorting**: detections are split into upper and lower jaw by median y-coordinate and sorted left-to-right by x-coordinate.
3. **Sequence correction**: each jaw is aligned with the expected FDI sequence (18→11, 21→28 for upper; 41→48, 38→31 for lower). Low-confidence predictions that break the sequence are reassigned to the expected label.

The algorithm allows gaps for missing teeth, making it robust for clinical cases with extracted or absent teeth.

![Heuristic algorithm](./assets/heuristic-algorithm.jpg)

## Model Training

### YOLO11-seg (FDI segmentation and numbering)

- **Base model**: `yolo11x-seg.pt`
- **Epochs**: 100
- **Batch size**: 16
- **Input resolution**: 640×640
- **Optimizer**: Adam
- **Learning rate**: 0.0001
- **Early stopping patience**: 10
- **Augmentation**: standard YOLO augmentation (mosaic, mixup, flips, rotation, translation)

### ResNet18 (status classification)

- **Base model**: ResNet18 pretrained on ImageNet
- **Epochs**: 30
- **Batch size**: 32
- **Input resolution**: 224×224
- **Optimizer**: Adam
- **Learning rate**: 0.001
- **Class weights**: inverse frequency weighting to handle class imbalance

## Performance Metrics

The following metrics illustrate the model's accuracy on the validation and test sets.

### Confusion Matrix

The confusion matrix shows the model's ability to correctly classify teeth versus background or other classes.

![Confusion Matrix](./assets/coverage_matrix.png)

### Precision Correlation

Precision reflects the quality of the detections (avoiding false positives).

![Precision](./assets/precision.png)

### Recall Analysis

Recall reflects the model's ability to find all relevant objects (avoiding false negatives).

![Recall](./assets/recall.png)

## Results and Deployment

The trained model is exported as `best.pt` and integrated into the `inference.py` pipeline. The deployed Modal endpoint applies YOLO11-seg prediction, heuristic FDI correction and ResNet18 status classification in a single request.

![Example prediction output](./assets/ending.jpg)

### Live endpoint

- **Modal app**: `dental-tooth-segmentation`
- **API endpoint**: `https://adrian-tucicovenco--dental-tooth-segmentation-api-predict.modal.run`

## References

Karaoglu, A., Ozcan, C., Pekince, A., & Yasa, Y. (2022). Numbering teeth in panoramic images: A novel method based on deep learning and heuristic algorithm. *Journal of Engineering and Technology*, 101316.
