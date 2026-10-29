# Model card: panoramic tooth segmentation and status classifier

| Field | Value |
| --- | --- |
| Document ID | PIX-AI-02 |
| Version | 0.1 (draft) |
| Owner | Model provider |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Model details

| Item | Value |
| --- | --- |
| Name | Pixtooth dental tooth segmentation |
| Version | Unversioned `best.pt` artifacts; no semantic model version is recorded |
| Type | Two-stage vision pipeline: instance segmentation plus image classification |
| Architecture | YOLO11x-seg for tooth masks, boxes and FDI labels; ResNet18 for status classification; heuristic post-processing for FDI correction |
| Input | Panoramic dental radiograph, resized to 640×640; masked tooth crops resized to 224×224 |
| Output | Per tooth: FDI number, bounding box, segmentation contour, status class, confidence scores |
| Framework | Ultralytics, PyTorch, torchvision, OpenCV |
| Runtime | Modal serverless endpoint, optionally called by the Pixtooth API |
| License | Code under Apache-2.0; model weights and Ultralytics terms are not resolved (see the [supplier register](./supplier-register.md)) |

## 2. Intended use

Assist a dentist in reviewing a panoramic radiograph by proposing tooth
segments, FDI numbers and a clinical status per tooth. The dentist reviews every
result.

### Out of scope

- autonomous diagnosis or treatment planning
- use without a qualified dentist reviewing the output
- intraoral, bitewing, CBCT or other imaging modalities
- primary or mixed dentition and pediatric patients
- implant planning, pathology detection or caries depth estimation
- forensic identification
- use on images with patient identifiers that have not been de-identified

## 3. Training data

| Item | Value |
| --- | --- |
| Source | Kaggle dataset `zwbzwb12341234/a-dual-labeled-dataset` |
| Content | Panoramic radiographs annotated with tooth contours and FDI numbers by dental specialists |
| Labels | 33 FDI classes (11–48 and 91 for supernumerary teeth); 7 clinical status classes |
| Status classes | no anomaly, filling, root canal treatment, crown, caries, residual root, root canal treatment with crown |
| Split | 80% train, 10% validation, 10% test |
| Preprocessing | Labelme JSON converted to YOLO segmentation format; masked crops for the classifier |
| Augmentation | Mosaic, mixup, flips, rotation, translation for segmentation; standard image transforms for classification |
| Class imbalance | Inverse-frequency class weights for the status classifier |
| Provenance | Dataset license, patient consent and acquisition sites are not documented |
| De-identification | Not documented |

## 4. Training procedure

### Segmentation and numbering

| Parameter | Value |
| --- | --- |
| Base model | `yolo11x-seg.pt` |
| Epochs | 100 |
| Batch size | 16 |
| Input size | 640×640 |
| Optimizer | Adam |
| Learning rate | 0.0001 |
| Early stopping | Patience 10 |

### Status classifier

| Parameter | Value |
| --- | --- |
| Base model | ResNet18 pretrained on ImageNet |
| Epochs | 30 |
| Batch size | 32 |
| Input size | 224×224 |
| Optimizer | Adam |
| Learning rate | 0.001 |

## 5. Evaluation

`apps/ml/TRAINING_REPORT.md` contains confusion-matrix, precision and recall
plots for the validation and test sets. It does **not** contain numeric values,
confidence intervals, per-class breakdowns or a calibration analysis. No
external validation set is used.

| Metric | Reported |
| --- | --- |
| Segmentation IoU | Not recorded numerically |
| FDI numbering accuracy | Not recorded numerically |
| Status precision, recall, F1 | Plots only; no table |
| Calibration | Not measured |
| Subgroup performance | Not measured |
| Robustness testing | Not performed |
| External validation | Not performed |

This is a material gap for any clinical claim. See risk R-05.

## 6. Limitations

- The model is trained on one public dataset; performance on another clinic's
  scanner, population and technique is unknown.
- The dataset may not represent all age groups, ethnicities, dental conditions or
  image qualities.
- The heuristic FDI correction can reassign a low-confidence detection to fit the
  expected sequence; a missing or supernumerary tooth can still be mis-numbered.
- Confidence scores are not calibrated and should not be read as probabilities.
- The status classifier sees a masked crop and has no clinical history, symptoms
  or other views.
- The pipeline does not detect pathology outside the seven status classes.
- Images may contain burned-in names, dates or DICOM metadata; the pipeline does
  not strip them.
- Model artifacts are not versioned, so a result cannot be tied to a specific
  weight file without extra work.

## 7. Ethical considerations

- Clinical decision support can cause harm if over-trusted. Human oversight and
  automation-bias training are required.
- A wrong suggestion can become part of the record if the dentist accepts it
  without review.
- Bias against under-represented groups is unmeasured.
- Training data provenance and consent are undocumented.
- Patient images leave the practice when the hosted inference endpoint is used.

## 8. Maintenance

| Item | Plan |
| --- | --- |
| Versioning | Assign a semantic version and hash to each artifact |
| Retraining | Only with a documented dataset change and a new validation |
| Monitoring | Track edits, deletions and complaints per class |
| Drift | Review yearly and when a new scanner or population is added |
| Rollback | Keep the previous artifact and the inference configuration |
| Ownership | Model provider; contact through the repository issue tracker |

## 9. Citation and references

Karaoglu, A., Ozcan, C., Pekince, A., & Yasa, Y. (2022). Numbering teeth in
panoramic images: A novel method based on deep learning and heuristic algorithm.
*Journal of Engineering and Technology*, 101316.

Training details: [apps/ml/TRAINING_REPORT.md](../../apps/ml/TRAINING_REPORT.md).

## 10. Related documents

- [AI governance](./ai-governance.md)
- [DPIA](./dpia.md)
- [Supplier register](./supplier-register.md)
- [Risk register](./risk-register.md)
