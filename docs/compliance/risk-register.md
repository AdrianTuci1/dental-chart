# Risk register

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-03 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Method

Likelihood and impact are scored from 1 to 5. The score is `likelihood × impact`.

| Score | Band | Treatment expectation |
| --- | --- | --- |
| 17–25 | Critical | Mitigate before production or stop the processing |
| 10–16 | High | Mitigate within 90 days; interim control documented |
| 5–9 | Medium | Mitigate within 180 days or accept with rationale |
| 1–4 | Low | Monitor; accept |

Treatment is one of: **mitigate**, **transfer** (contract or insurance),
**avoid** (remove the processing) or **accept** (recorded with an expiry date).

The register is reviewed every six months. Critical and high risks are reviewed
quarterly and after any incident, supplier change or model release.

## 2. Register

| ID | Risk | L | I | Score | Treatment | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | No MFA for clinicians or platform administrators; one stolen password gives access to patient data | 4 | 5 | 20 | Mitigate: TOTP or passkeys, enforced for admins first | Maintainer and operator | Planned |
| R-02 | No persistent audit trail for patient record access, exports, admin actions and AI analyses | 4 | 4 | 16 | Mitigate: append-only audit store, event schema and retention | Maintainer | Planned |
| R-03 | `POST /api/ai/analyze` is unauthenticated; anyone can consume inference capacity and submit images | 4 | 4 | 16 | Mitigate: require authentication and quota per account | Maintainer | Planned |
| R-04 | Panoramic X-rays are sent to Modal for inference without a verified DPA, region or de-identification step | 3 | 5 | 15 | Mitigate: DPA, EU region, metadata stripping, retention confirmation | Maintainer and operator | Partial |
| R-05 | Model has no external clinical validation or numeric performance evidence in the repository | 3 | 5 | 15 | Mitigate: validation study, metrics by class and subgroup, model card update | Model provider | Planned |
| R-06 | Training dataset provenance and license are not documented; redistribution rights unclear | 3 | 4 | 12 | Mitigate: record source, license and terms; replace data if rights are insufficient | Model provider | Planned |
| R-07 | Retention is not automated; patient records, images and logs can be kept indefinitely | 4 | 4 | 16 | Mitigate: retention configuration, scheduled deletion, evidence | Operator | Planned |
| R-08 | Reference deployment has no tested backup and restore procedure | 3 | 4 | 12 | Mitigate: PITR or daily dump, quarterly restore test | Operator | Planned |
| R-09 | CI runs only on `workflow_dispatch`; changes can merge without automated tests or license checks | 3 | 4 | 12 | Mitigate: run on pull request and protect the branch | Maintainer | Planned |
| R-10 | Dependencies are not continuously monitored for vulnerabilities; no SBOM is published | 4 | 3 | 12 | Mitigate: Dependabot or equivalent, weekly audit, SBOM per release | Maintainer | Planned |
| R-11 | Refresh tokens last 365 days and are stored in `localStorage`; no device binding | 3 | 4 | 12 | Mitigate: shorten lifetime, rotation policy, consider httpOnly cookies | Maintainer | Partial |
| R-12 | Lambda secrets arrive as environment variables and are readable by anyone who can read the function configuration | 3 | 4 | 12 | Mitigate: SSM `SecureString` or Secrets Manager references | Maintainer and operator | Partial |
| R-13 | Worker rate limiting is per isolate, so configured limits understate the real allowance | 3 | 3 | 9 | Mitigate: edge rate limiting or Durable Object counter | Maintainer and operator | Partial |
| R-14 | Breach notification and MDR incident procedures are documented but never exercised | 3 | 4 | 12 | Mitigate: tabletop exercise, contact list, template notices | Operator | Planned |
| R-15 | Platform administrator membership is an email list with no approval or review workflow | 2 | 4 | 8 | Mitigate: quarterly review, four-eyes change, alert on change | Operator | Partial |
| R-16 | Account and patient deletion does not cover backups, platform logs or supplier copies | 3 | 3 | 9 | Mitigate: document backup expiry, suppress from restores, supplier deletion terms | Operator | Partial |
| R-17 | No documented key management or rotation procedure for JWT, refresh, database and provider secrets | 2 | 4 | 8 | Mitigate: KMS or secret manager, rotation schedule, break-glass procedure | Operator | Planned |
| R-18 | Modal or email provider outage degrades the service | 3 | 2 | 6 | Mitigate: fallback detections and logged email failure already exist; monitor and alert | Maintainer and operator | Implemented |
| R-19 | Insider or shared-account access to patient data without attributable logging | 2 | 4 | 8 | Mitigate: unique accounts, audit trail, access review | Operator | Partial |
| R-20 | Vulnerability reports may exceed the five-day acknowledgement target under load | 2 | 2 | 4 | Accept: single maintainer, best-effort target published in `SECURITY.md` | Maintainer | Accepted |
| R-21 | Ultralytics YOLO11 is AGPL-3.0 by default; distributing a combined work under Apache-2.0 may breach its license | 4 | 4 | 16 | Mitigate: legal review, commercial license or replace the model; publish the decision | Maintainer | Planned |

## 3. Treatment notes

### R-01 MFA

Start with platform administrators, then clinic owners, then all medics. A
password plus a stolen session is enough to read patient records today. MFA on
the identity provider helps only for Google accounts; password accounts need an
application-level second factor.

### R-02 Audit trail

The audit trail must record who read which patient, not only who changed it.
Health data access is the primary insider risk. See
[audit-logging.md](./audit-logging.md) for the event catalog and schema.

### R-03 Public AI endpoint

The endpoint accepts a raw image body and has no authentication or per-account
quota. Until it is closed, the operator should block `/api/ai/analyze` at the
edge, or accept the cost and abuse risk in writing. The fallback path does not
need the endpoint.

### R-04 AI data transfer

Before production use, confirm the Modal contract, the processing region, the
retention of request bodies and the de-identification of image metadata. A
panoramic radiograph can contain a name, a date of birth or a patient number.
Strip DICOM tags and burned-in identifiers where possible.

### R-07 Retention

National law sets the minimum retention for dental records; the practice sets
the maximum. The application has deletion endpoints but no scheduler. A
retention job must produce evidence of deletion, including counts and failures.

### R-09 CI trigger

`.github/workflows/ci.yml` currently starts only on manual dispatch. Running it
on `pull_request` and requiring the check before merge is a configuration change,
not a code change. Branch protection is owned by the repository administrator.

### R-21 Model licensing

The ML pipeline installs `ultralytics` without a version pin or a license
decision. Ultralytics publishes YOLO under AGPL-3.0 and sells a commercial
license. AGPL can extend to a network service built on the model. Record the
decision before distributing the Lambda or Worker artifact that includes the ML
code, and before offering a hosted inference service.

## 4. Accepted risks

R-20 is accepted because the project has a single maintainer and publishes a
best-effort response target. Acceptance is reviewed every six months. Any other
acceptance needs an expiry date and a compensating control.

## 5. Related documents

- [Information security policy](./information-security-policy.md)
- [Statement of applicability](./statement-of-applicability.md)
- [Access control policy](./access-control-policy.md)
- [AI governance](./ai-governance.md)
- [Incident response](./incident-response.md)
