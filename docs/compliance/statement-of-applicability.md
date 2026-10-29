# Statement of applicability

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-04 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Purpose

This statement records which ISO/IEC 27001:2022 Annex A controls apply to
Pixtooth and how far each one is implemented. It is a gap analysis, not a
certification statement.

## 2. Scope

The scope is the Pixtooth software product: source code, build and release
pipeline, reference deployment templates, and the maintainer's development
activities. Controls that depend on premises, employment, contracts or the
operator's management system are marked **Deploying organization**.

The deploying organization must extend this statement with its own scope,
interfaces and dependencies before an ISO 27001 audit.

## 3. Applicability rules

- **Yes** — the control applies to the product or the maintainer's activities.
- **No** — the control is excluded; the justification is in the row.
- **Deploying organization** — the control is outside the repository and is
  owned by the operator.

Status values are defined in the [compliance index](./README.md).

## 4. A.5 Organizational controls

| Control | Name | Applies | Status | Evidence or gap |
| --- | --- | --- | --- | --- |
| 5.1 | Policies for information security | Yes | Partial | PIX-SEC-01 is a draft; no approval or management review |
| 5.2 | Roles and responsibilities | Yes | Partial | Roles defined in PIX-SEC-01 and PIX-SEC-02; not formally assigned |
| 5.3 | Segregation of duties | Yes | Partial | Code owner review and DCO; one maintainer holds all roles |
| 5.4 | Management responsibilities | Deploying organization | Deploying organization | Operator management commitment |
| 5.5 | Contact with authorities | Yes | Planned | No authority contact list or notification channel |
| 5.6 | Contact with special interest groups | Yes | Planned | No security community or clinician advisory group |
| 5.7 | Threat intelligence | Yes | Planned | No threat feed or review cadence |
| 5.8 | Information security in project management | Yes | Partial | Security requirements appear in reviews and tests; no project risk gate |
| 5.9 | Inventory of assets | Yes | Partial | Repository and services documented in README; no complete asset register |
| 5.10 | Acceptable use of assets | Yes | Partial | `SECURITY.md` and `CONTRIBUTING.md`; no signed acceptable-use terms |
| 5.11 | Return of assets | Deploying organization | Deploying organization | Operator offboarding |
| 5.12 | Classification of information | Yes | Partial | Patient data classified as special category in PIX-DP-01; no labelling scheme |
| 5.13 | Labelling of information | Yes | Planned | No labels on exports, backups or tickets |
| 5.14 | Information transfer | Yes | Partial | TLS in transit; transfers to Modal and email providers lack verified agreements |
| 5.15 | Access control | Yes | Partial | PIX-SEC-02 and route middleware; no MFA |
| 5.16 | Identity management | Yes | Implemented | Unique medic IDs, status field, account lifecycle in `MedicService` |
| 5.17 | Authentication information | Yes | Partial | bcrypt, reset expiry, token hashing; no MFA, long refresh lifetime |
| 5.18 | Access rights | Yes | Partial | Role and clinic checks; access reviews are manual |
| 5.19 | Supplier relationships | Yes | Planned | Supplier register is a draft; no signed DPAs in the repository |
| 5.20 | Supplier agreements | Yes | Planned | DPA and security terms not verified |
| 5.21 | ICT supply chain | Yes | Partial | Lockfiles, license allowlist, pinned base images; no provenance attestation |
| 5.22 | Supplier monitoring | Yes | Planned | No periodic supplier review evidence |
| 5.23 | Cloud services | Yes | Partial | Deployment docs describe shared responsibility; no cloud control matrix |
| 5.24 | Incident management planning | Yes | Partial | PIX-SEC-08 is a draft; no exercised plan |
| 5.25 | Assessment of security events | Yes | Planned | No triage log or severity record |
| 5.26 | Response to incidents | Yes | Planned | No exercised containment or notification |
| 5.27 | Learning from incidents | Yes | Planned | No post-incident review record |
| 5.28 | Collection of evidence | Yes | Partial | Application and platform logs exist; no chain-of-custody procedure |
| 5.29 | Security during disruption | Yes | Partial | AI fallback and email failure handling exist; no continuity plan test |
| 5.30 | ICT readiness for business continuity | Yes | Planned | PIX-SEC-10 defines targets; restore never tested in the reference deployment |
| 5.31 | Legal and regulatory requirements | Yes | Partial | PIX-DP-01 and PIX-AI-01 list obligations; legal review outstanding |
| 5.32 | Intellectual property rights | Yes | Implemented | Apache-2.0, `NOTICE`, dependency license check in CI |
| 5.33 | Protection of records | Yes | Partial | Database access controls; retention and audit records incomplete |
| 5.34 | Privacy and protection of PII | Yes | Partial | ROPA and DPIA drafts; DPAs and retention automation missing |
| 5.35 | Independent review | Yes | Planned | No independent security or compliance review |
| 5.36 | Compliance with policies | Yes | Planned | No compliance monitoring or internal audit |
| 5.37 | Documented operating procedures | Yes | Partial | README, deployment and runbook docs; no controlled document process |

## 5. A.6 People controls

| Control | Name | Applies | Status | Evidence or gap |
| --- | --- | --- | --- | --- |
| 6.1 | Screening | Deploying organization | Deploying organization | Operator hiring process |
| 6.2 | Terms and conditions of employment | Deploying organization | Deploying organization | Operator employment contracts |
| 6.3 | Awareness, education and training | Deploying organization | Deploying organization | Operator training programme |
| 6.4 | Disciplinary process | Deploying organization | Deploying organization | Operator HR process |
| 6.5 | Responsibilities after termination | Deploying organization | Deploying organization | Operator offboarding, supported by PIX-SEC-02 |
| 6.6 | Confidentiality agreements | Deploying organization | Deploying organization | Operator NDAs |
| 6.7 | Remote working | Deploying organization | Deploying organization | Operator remote-work rules |
| 6.8 | Information security event reporting | Yes | Partial | External reporting in `SECURITY.md`; internal channel not defined |

## 6. A.7 Physical controls

All physical controls are inherited from the cloud provider or owned by the
deploying organization. The repository contains no physical processing facility.

| Control | Name | Applies | Status | Evidence or gap |
| --- | --- | --- | --- | --- |
| 7.1 | Physical security perimeters | Deploying organization | Deploying organization | Cloud provider and operator premises |
| 7.2 | Physical entry | Deploying organization | Deploying organization | Cloud provider and operator premises |
| 7.3 | Securing offices, rooms and facilities | Deploying organization | Deploying organization | Operator premises |
| 7.4 | Physical security monitoring | Deploying organization | Deploying organization | Cloud provider and operator premises |
| 7.5 | Protecting against physical and environmental threats | Deploying organization | Deploying organization | Cloud provider and operator premises |
| 7.6 | Working in secure areas | Deploying organization | Deploying organization | Operator premises |
| 7.7 | Clear desk and clear screen | Deploying organization | Deploying organization | Operator policy |
| 7.8 | Equipment siting and protection | Deploying organization | Deploying organization | Operator and cloud provider |
| 7.9 | Security of assets off-premises | Deploying organization | Deploying organization | Operator laptops and mobile devices |
| 7.10 | Storage media | Deploying organization | Deploying organization | Operator media handling and disposal |
| 7.11 | Supporting utilities | Deploying organization | Deploying organization | Cloud provider and operator premises |
| 7.12 | Cabling security | Deploying organization | Deploying organization | Cloud provider and operator premises |
| 7.13 | Equipment maintenance | Deploying organization | Deploying organization | Cloud provider and operator |
| 7.14 | Secure disposal or re-use of equipment | Deploying organization | Deploying organization | Operator disposal procedure |

## 7. A.8 Technological controls

| Control | Name | Applies | Status | Evidence or gap |
| --- | --- | --- | --- | --- |
| 8.1 | User endpoint devices | Deploying organization | Deploying organization | Operator device management |
| 8.2 | Privileged access rights | Yes | Partial | Admin allowlist and route guard; no MFA or just-in-time access |
| 8.3 | Information access restriction | Yes | Implemented | `requireAuth`, clinic membership checks, medic-scoped routes |
| 8.4 | Access to source code | Yes | Partial | GitHub repository; branch protection and review rules not documented |
| 8.5 | Secure authentication | Yes | Partial | bcrypt, JWT, rotating refresh tokens; no MFA |
| 8.6 | Capacity management | Yes | Partial | Provider autoscaling; no quotas or capacity review |
| 8.7 | Protection against malware | Deploying organization | Deploying organization | Managed runtimes; no endpoint control in the repository |
| 8.8 | Management of technical vulnerabilities | Yes | Partial | `SECURITY.md` and dependency pinning; no scanning or SBOM |
| 8.9 | Configuration management | Yes | Partial | Example env files and `/api/config`; no hardened baselines |
| 8.10 | Information deletion | Yes | Partial | Patient, clinic and account deletion; no scheduled retention |
| 8.11 | Data masking | Yes | Planned | No masking for logs, exports or non-production data |
| 8.12 | Data leakage prevention | Yes | Partial | `no-store`, scoped API, no patient data in analytics; no DLP tooling |
| 8.13 | Information backup | Yes | Planned | PIX-SEC-10 defines procedures; not automated in the reference stack |
| 8.14 | Redundancy of processing facilities | Yes | Partial | Provider multi-AZ; no application-level failover |
| 8.15 | Logging | Yes | Partial | Console and platform logs; no structured security audit log |
| 8.16 | Monitoring activities | Yes | Planned | No alerting on auth failures, admin actions or AI usage |
| 8.17 | Clock synchronization | Yes | Partial | Provider time services and ISO timestamps; no documented requirement |
| 8.18 | Privileged utility programs | Deploying organization | Deploying organization | Operator infrastructure access |
| 8.19 | Software installation on operational systems | Yes | Partial | Container images and lockfiles; no endpoint installation policy |
| 8.20 | Networks security | Yes | Partial | TLS and provider controls; no documented WAF or network segmentation |
| 8.21 | Security of network services | Yes | Partial | Managed API gateway and CDN; no service-level security review |
| 8.22 | Segregation of networks | Yes | Partial | Separate web, admin and API origins; shared backend network |
| 8.23 | Web filtering | Deploying organization | Deploying organization | Operator network policy |
| 8.24 | Use of cryptography | Yes | Partial | TLS, bcrypt, hashed tokens; key management and rotation undocumented |
| 8.25 | Secure development life cycle | Yes | Partial | Pull requests, tests, DCO; CI runs manually |
| 8.26 | Application security requirements | Yes | Partial | Security tests and review; no written requirements per feature |
| 8.27 | Secure system architecture | Yes | Implemented | Modular monolith, explicit layers, composition root, trust boundaries |
| 8.28 | Secure coding | Yes | Partial | Code review and tests; no SAST or lint security rules |
| 8.29 | Security testing in development | Yes | Partial | Unit and integration tests; no DAST or annual penetration test |
| 8.30 | Outsourced development | No | Not applicable | Development is done in the public repository; no outsourced team |
| 8.31 | Separation of environments | Yes | Partial | Dev and production configuration exist; separation is not enforced |
| 8.32 | Change management | Yes | Partial | PR flow and deploy scripts; CI trigger and branch protection incomplete |
| 8.33 | Test information | Yes | Planned | Tests use synthetic fixtures; no written rule against production data |
| 8.34 | Protection during audit testing | Yes | Planned | No audit-testing procedure or data-handling agreement |

## 8. Summary

| Status | Count |
| --- | --- |
| Implemented | 4 |
| Partial | 43 |
| Planned | 18 |
| Deploying organization | 27 |
| Not applicable | 1 |
| **Total** | **93** |

The counts are a planning aid. Certification requires every applicable control
to be implemented, evidenced and reviewed, and the operator-owned controls to be
covered by the deploying organization's own statement.

## 9. Related documents

- [Compliance index](./README.md)
- [Risk register](./risk-register.md)
- [Information security policy](./information-security-policy.md)
- [Data protection](./data-protection.md)
- [AI governance](./ai-governance.md)
