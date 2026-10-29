# AI governance

| Field | Value |
| --- | --- |
| Document ID | PIX-AI-01 |
| Version | 0.1 (draft) |
| Owner | Project maintainer as model provider; deploying organization as user |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

> This document records the intended use, the likely regulatory classification and
> the obligations that follow. It is not a conformity assessment and does not
> claim CE marking. Legal classification must be confirmed by the provider before
> clinical use.

## 1. Intended use

Pixtooth's AI component assists a dentist with panoramic radiographs:

- segment each visible tooth
- assign an FDI number
- suggest a clinical status per tooth
- return a confidence score for each detection

The output is a suggestion rendered over the image. The dentist reviews, edits or
deletes detections and remains responsible for the diagnosis and treatment plan.
The component does not produce a diagnosis on its own, does not write directly to
the patient record, and is not a substitute for clinical examination.

The component can be disabled with `AI_ANALYSIS_ENABLED=false`; the application
then serves packaged fallback detections for demonstration.

## 2. Regulatory classification

### 2.1 Medical device

Software intended by its manufacturer to be used for diagnosis or treatment
support is a medical device under MDR Article 2(1). Tooth segmentation and
clinical status classification support diagnostic decisions. Under MDR Rule 11,
software providing information used to take diagnostic or therapeutic decisions
is normally Class IIa, and can be higher when the decision may cause death or
irreversible deterioration.

The provider must confirm the class and the conformity route. A Class IIa device
requires a notified body, a quality management system, a technical file,
clinical evaluation and post-market surveillance.

### 2.2 EU AI Act

A high-risk AI system under Article 6 and Annex I includes a safety component of
a product covered by the medical device regulation where that product requires
third-party conformity assessment. A Class IIa medical device with an AI safety
component therefore falls into the high-risk category. If the product is
classified as a Class I device without third-party assessment, the high-risk
route may not apply; the provider must document the reasoning.

The system is not a general-purpose AI model. The obligations below are the
provider's, with the deploying practice acting as a deployer.

## 3. Obligations and current status

| AI Act / MDR obligation | Requirement | Status |
| --- | --- | --- |
| Art. 9 risk management | Continuous risk management across the lifecycle | Planned; this register and DPIA are inputs |
| Art. 10 data governance | Relevant, representative, error-checked data; bias examination | Partial; dataset described, provenance and bias analysis missing |
| Art. 11 technical documentation | Annex IV file, kept current | Planned; [model card](./model-card.md) is a start |
| Art. 12 record-keeping | Automatic logs of events over the lifetime | Not implemented; see [audit-logging.md](./audit-logging.md) |
| Art. 13 transparency | Instructions for use, capabilities and limits | Partial; README and model card, no regulated instructions for use |
| Art. 14 human oversight | Effective review, ability to override, awareness of automation bias | Partial; UI allows review and deletion, no confirmation record or training |
| Art. 15 accuracy, robustness, cybersecurity | Declared metrics, resilience, adversarial testing | Not met; no numeric validation, no robustness or adversarial testing |
| Art. 17 quality management system | Documented QMS, responsibilities, processes | Not implemented |
| Art. 43 conformity assessment | Assessment before placing on the market | Not performed |
| Art. 47 EU declaration of conformity | Signed declaration | Not available |
| Art. 48 CE marking | Affixed marking | Not available |
| Art. 49 registration | Registration in the EU database | Not performed |
| Art. 72 post-market monitoring | Documented plan and data collection | Planned; outline in section 7 |
| Art. 73 serious incident reporting | Report to market surveillance authority | Planned; see [incident-response.md](./incident-response.md) |
| MDR clinical evaluation | Clinical evidence for the intended use | Not available |
| MDR post-market surveillance | PMS plan and periodic report | Not available |
| MDR vigilance | Incident and field safety corrective action | Planned |

## 4. Human oversight design

Required behaviour:

1. The UI labels the overlay as an AI suggestion and shows the model version.
2. Each detection shows a confidence score; low-confidence detections are visually
   distinct.
3. The dentist can accept, edit or delete each detection.
4. Nothing is written to the patient record until the dentist acts.
5. The interface warns that the output can be wrong and does not replace clinical
   judgement.
6. The dentist's decision is recorded with the model version and timestamp.

| Item | State |
| --- | --- |
| Detections rendered over the image | Implemented |
| Delete a detection | Implemented |
| Confidence shown per detection | Implemented in the detection data; verify the visual treatment |
| AI label and model version in the UI | Not implemented |
| Explicit accept or reject action | Not implemented |
| Decision written to the record with model version | Not implemented |
| Automation-bias warning and training | Not implemented |

## 5. Data governance

| Topic | State |
| --- | --- |
| Dataset source | Kaggle `zwbzwb12341234/a-dual-labeled-dataset`; terms not recorded |
| Annotation | Tooth contours and FDI numbers by dental specialists, per the dataset card |
| Splits | 80% train, 10% validation, 10% test |
| Classes | 33 FDI labels (11–48 and 91), 7 status classes |
| Representativeness | Not assessed; no demographic or scanner breakdown |
| Bias testing | Not performed |
| De-identification | Not implemented; images may contain burned-in identifiers or DICOM metadata |
| Patient consent for training data | Not documented; the dataset is the source of truth |
| Data retention for inference | Image not stored by the backend; Modal retention unverified |

Before clinical use, the provider must document the dataset license, the
annotation protocol, the inclusion and exclusion criteria, the demographic
coverage and the de-identification step. See risk R-04 and R-06.

## 6. Accuracy and robustness

The repository contains a training report with loss and metric plots, but no
numeric table of precision, recall, F1, segmentation IoU or calibration by class.
That is not sufficient for a declared performance claim.

Required before a performance claim:

- test-set metrics per FDI class and per status class, with confidence intervals
- segmentation IoU and boundary accuracy
- confusion between clinically similar statuses
- performance by image quality, scanner and patient subgroup where available
- calibration of confidence scores
- robustness to rotation, cropping, noise, compression and metadata removal
- failure analysis for missing, supernumerary and unerupted teeth
- a locked test set that is never used for tuning

## 7. Post-market monitoring

The provider should:

1. Assign a model version to every release and record it with each inference.
2. Collect dentist feedback on wrong detections and wrong status suggestions.
3. Monitor the rate of edits and deletions per class.
4. Track complaints and suspected incidents.
5. Review new literature and dataset drift yearly.
6. Retrain only with a documented change, a new validation and a new version.
7. Report serious incidents to the market surveillance authority within the
   applicable deadline.
8. Publish a periodic post-market performance report.

## 8. Provider checklist

- [ ] confirm MDR classification and the conformity route
- [ ] establish an ISO 13485 quality management system
- [ ] complete the Annex IV technical documentation
- [ ] run a clinical evaluation and publish the protocol
- [ ] produce numeric performance and robustness results
- [ ] de-identify images before inference
- [ ] sign the Modal DPA and pin the processing region
- [ ] implement AI event logging with model version
- [ ] publish instructions for use and a patient-facing explanation
- [ ] register the device and affix CE marking
- [ ] set up post-market surveillance and vigilance
- [ ] train users on oversight and automation bias

Until this checklist is complete, the AI component should be described as a
research and demonstration feature, not as a validated diagnostic aid.

## 9. Related documents

- [Model card](./model-card.md)
- [DPIA](./dpia.md)
- [Data protection](./data-protection.md)
- [Audit logging](./audit-logging.md)
- [Incident response](./incident-response.md)
- [Risk register](./risk-register.md)
