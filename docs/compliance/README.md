# Compliance documentation

This directory holds the compliance documentation for Pixtooth. It covers the
software in this repository and the controls a deploying organization has to
operate around it.

> **Status: draft, not certified.** Pixtooth has no ISO/IEC 27001 certificate, no
> SOC 2 report and no EU AI Act conformity assessment. These documents describe
> the control framework being built, the controls that already exist in code and
> the gaps that remain. They are not legal advice and they are not evidence of
> certification. Do not describe a deployment as ISO 27001, SOC 2, GDPR, HIPAA,
> MDR or AI Act compliant on the basis of this directory.

## Scope and shared responsibility

Pixtooth is open-source software that a dental practice or a service operator
runs on its own infrastructure. Responsibility is split:

| Area | Owner |
| --- | --- |
| Application code, secure development, dependency licensing, vulnerability handling | Project maintainer |
| Hosting, access to infrastructure, backups, retention, incident response, staff, contracts, clinical governance | Deploying organization |
| Clinical use of AI output, patient information, legal basis for processing | Deploying organization as controller |
| Model training, model documentation, intended use, post-market monitoring | Model provider (project maintainer while the reference model is distributed) |

A control marked **Deploying organization** cannot be implemented in this
repository. The deploying organization must adopt it in its own management
system and keep its own evidence.

## Status legend

| Status | Meaning |
| --- | --- |
| **Implemented** | Present in the repository and exercised by code paths or tests |
| **Partial** | A measure exists, but the documented requirement is not fully met |
| **Planned** | Documented requirement with no operating control yet |
| **Deploying organization** | Operational, contractual, physical or HR control owned by the operator |
| **Not applicable** | Excluded with a written justification in the statement of applicability |

## Immediate priorities

These are the open items that most change the risk position. The full list is in
the [risk register](./risk-register.md).

1. Add MFA for platform administrators, then clinic owners, then all medics
   (R-01).
2. Implement the audit trail for patient record access and AI analyses (R-02).
3. Require authentication for `POST /api/ai/analyze` (R-03).
4. Sign the Modal DPA, pin the processing region and de-identify images (R-04).
5. Automate retention and document the backup expiry (R-07).
6. Run CI on pull requests and protect `main` (R-09).
7. Produce a clinical validation with numeric metrics before any diagnostic
   claim (R-05).
8. Resolve the Ultralytics and dataset licensing (R-06, R-21).

## Document map

| Document | ID | Covers |
| --- | --- | --- |
| [information-security-policy.md](./information-security-policy.md) | PIX-SEC-01 | objectives, roles, policy statements, exceptions, review |
| [access-control-policy.md](./access-control-policy.md) | PIX-SEC-02 | identity lifecycle, roles, authentication, privileged access, reviews |
| [risk-register.md](./risk-register.md) | PIX-SEC-03 | risk method, scored register, treatments and owners |
| [statement-of-applicability.md](./statement-of-applicability.md) | PIX-SEC-04 | ISO/IEC 27001:2022 Annex A mapping and applicability |
| [soc2-readiness.md](./soc2-readiness.md) | PIX-SOC-01 | Trust Services Criteria mapping and evidence plan |
| [change-management.md](./change-management.md) | PIX-SEC-05 | secure development, review, CI gates, release and rollback |
| [vulnerability-management.md](./vulnerability-management.md) | PIX-SEC-06 | scanning, severity SLAs, disclosure, SBOM, pentest |
| [supplier-register.md](./supplier-register.md) | PIX-SEC-07 | subprocessors, data categories, DPA and transfer checks |
| [incident-response.md](./incident-response.md) | PIX-SEC-08 | severity, roles, containment, GDPR and MDR notification |
| [audit-logging.md](./audit-logging.md) | PIX-SEC-09 | events to record, schema, integrity, retention, current gap |
| [backup-and-recovery.md](./backup-and-recovery.md) | PIX-SEC-10 | RPO/RTO, backup procedures, restore tests |
| [data-protection.md](./data-protection.md) | PIX-DP-01 | ROPA, lawful basis, retention, data subject requests, transfers |
| [dpia.md](./dpia.md) | PIX-DP-02 | data protection impact assessment for patient and AI processing |
| [ai-governance.md](./ai-governance.md) | PIX-AI-01 | AI Act and MDR classification, obligations, oversight, post-market |
| [model-card.md](./model-card.md) | PIX-AI-02 | model purpose, training data, performance, limits |

## How the pack maps to the standards

| Standard | What this pack provides | What is still missing |
| --- | --- | --- |
| ISO/IEC 27001:2022 | Risk method, risk register, [Annex A applicability](./statement-of-applicability.md), policy set, audit and supplier documentation | Operating ISMS, internal audit, management review, evidence over time, certification audit |
| SOC 2 | [Control mapping](./soc2-readiness.md) for security, availability and confidentiality | Documented policies adopted by an operating entity, monitoring evidence, observation period, CPA report |
| GDPR | ROPA, DPIA, retention rules, DSR procedure, processor register, incident notification | Completed DPIA signed by the controller, signed DPAs, actual retention automation, records of requests |
| EU AI Act / MDR | Intended use, risk classification, model card, oversight design, post-market plan | Clinical evaluation, QMS under ISO 13485, technical file, conformity assessment, CE marking, registration |
| ISO/IEC 42001 | AI policy, roles and impact assessment inputs | Full AI management system, objectives, internal audit, certification |

## How to use this pack

1. Read [statement-of-applicability.md](./statement-of-applicability.md) to see
   which controls apply to the repository and which belong to the operator.
2. Treat every **Planned** row as open work. The risk register gives the order.
3. A deploying organization should copy the operator-owned sections into its own
   management system, replace the placeholders with its own roles and evidence,
   and have the result reviewed by legal and clinical governance.
4. Re-review this pack when the architecture, data flows, subprocessors or AI
   model change, and at least once a year.

## Evidence rules

- A document is not evidence that a control operates. Evidence is a test run, a
  log export, a signed contract, a ticket or an audit record with a date.
- Screenshots and logs must not contain patient data, tokens or secrets.
- Keep evidence for the retention period defined in
  [data-protection.md](./data-protection.md), outside the production database.

## Document control

| Field | Value |
| --- | --- |
| Version | 0.1 (draft) |
| Date | 2026-10-29 |
| Owner | Project maintainer |
| Next review | 2027-04-29 |
| Classification | Public |
