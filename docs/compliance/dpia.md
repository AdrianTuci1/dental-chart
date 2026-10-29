# Data protection impact assessment

| Field | Value |
| --- | --- |
| Document ID | PIX-DP-02 |
| Version | 0.1 (draft template) |
| Owner | Deploying organization as controller; project maintainer for the software description |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

> This is a draft. A controller must complete it for its own practice, with its
> own legal basis, retention period, patient population and subprocessors. It is
> not a signed DPIA and it does not replace advice from a DPO or lawyer.

## 1. Why a DPIA is needed

The processing involves health data (GDPR Article 9), a large set of patients,
systematic recording of care, and an AI component that receives radiographs.
Article 35 and most supervisory authority lists treat this combination as
likely to result in a high risk, so a DPIA is expected before production use.

## 2. System description

Pixtooth is a web application with three parts:

- a clinic web app for patient records, dental charts, treatment plans and X-ray
  review
- a separate admin app for platform account management
- an API backed by DynamoDB or PostgreSQL, with optional email and AI providers

Data flows:

1. A medic signs in through the clinic app. The API issues a 15-minute access
   token and a rotating refresh token.
2. The medic creates or opens a patient. The record is scoped to the clinic and
   stored in the document database.
3. The medic uploads or opens a panoramic X-ray. The browser sends the image to
   `POST /api/ai/analyze`.
4. The API forwards the image to the Modal inference endpoint. The model returns
   tooth contours, FDI numbers, status suggestions and confidence scores.
5. The browser renders the result over the image. The dentist accepts, edits or
   deletes detections. The image and detections are not stored by the backend.
6. Transactional email sends invitations and password resets through the
   configured provider.
7. Telemetry records feature usage per medic. Security logs record requests.

## 3. Necessity and proportionality

| Question | Assessment |
| --- | --- |
| Is the processing necessary for the purpose? | Yes for the record and chart. AI assistance is optional and can be disabled with `AI_ANALYSIS_ENABLED=false`. |
| Is the data minimized? | The record holds clinical data needed for care. The AI request carries the full image, which may include identifiers; de-identification is not implemented. |
| Are retention periods defined? | The rule is documented; automation is missing. |
| Are data subjects informed? | The controller must publish a notice; no notice ships with the software. |
| Are rights enforceable? | Deletion and correction exist; export is manual. |
| Is access limited? | Clinic membership and role checks exist; MFA is missing. |
| Is the AI output explained? | Confidence scores and detections are shown; the model card is published; clinical validation is missing. |

## 4. Risks to data subjects

| ID | Risk | Likelihood | Impact | Mitigation | Residual |
| --- | --- | --- | --- | --- | --- |
| D-01 | Unauthorized access through a stolen password because MFA is absent | High | High | MFA, session monitoring, shorter refresh lifetime | High until MFA |
| D-02 | Insider reads patient records without attribution | Medium | High | Audit trail, access reviews, unique accounts | High until audit trail |
| D-03 | X-ray with identifiers is transferred to Modal without a DPA or EU region | Medium | High | DPA, region selection, metadata stripping, retention confirmation | High until verified |
| D-04 | AI suggests a wrong status and the dentist relies on it | Medium | High | Human review, confidence display, model card, clinical validation, training | Medium |
| D-05 | Model performs worse for a subgroup because validation is missing | Medium | High | Subgroup validation, bias testing, post-market monitoring | High until validation |
| D-06 | Records are kept longer than necessary | High | Medium | Retention configuration and scheduled deletion | High until automated |
| D-07 | Deleted data survives in backups or supplier copies | Medium | Medium | Backup expiry, restore suppression, supplier deletion terms | Medium |
| D-08 | A breach is not notified in time | Medium | High | Incident plan, contact list, exercise | Medium |
| D-09 | Logs contain patient data or tokens | Low | High | Log redaction rules, review, tests | Low |
| D-10 | Open registration lets an unknown person create an account | Medium | Low | Invitation-only mode or edge restriction | Medium |

## 5. Measures required before production

1. Enable MFA for platform administrators and clinic owners, then all medics.
2. Implement the audit trail for record access and AI analyses.
3. Sign a DPA with Modal and confirm the processing region and retention.
4. Strip DICOM metadata and burned-in identifiers before inference where the
   image is not already de-identified.
5. Set and automate retention; document the backup expiry.
6. Complete a clinical validation and publish numeric performance by class.
7. Publish the patient notice and the record of processing activities.
8. Run a breach tabletop exercise and keep the contact list current.
9. Restrict open registration if the practice does not want public sign-ups.
10. Test a restore and record the result.

## 6. Consultation

| Step | Owner | Status |
| --- | --- | --- |
| DPO or privacy advisor review | Controller | Not started |
| Legal review of the notice and DPA | Controller | Not started |
| Clinical safety review | Clinical lead | Not started |
| Supervisory authority consultation, if residual risk stays high | Controller | Not required yet |
| Sign-off | Controller | Not signed |

## 7. Review triggers

Review this DPIA when:

- the AI model, provider or region changes
- a new subprocessor receives patient data
- MFA, audit logging or retention automation is released
- a security or safety incident occurs
- the practice changes its patient population, legal basis or retention rule
- at least once a year

## 8. Related documents

- [Data protection register](./data-protection.md)
- [AI governance](./ai-governance.md)
- [Model card](./model-card.md)
- [Risk register](./risk-register.md)
- [Incident response](./incident-response.md)
