# SOC 2 readiness

| Field | Value |
| --- | --- |
| Document ID | PIX-SOC-01 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

> There is no SOC 2 report. This document maps the Trust Services Criteria to the
> controls that exist and the evidence that is missing. It is a readiness
> assessment, not an audit opinion.

## 1. What SOC 2 requires

SOC 2 is an attestation by a licensed CPA firm against the AICPA Trust Services
Criteria. Two report types exist:

- **Type I** — the design of controls at a point in time.
- **Type II** — the design and operating effectiveness over an observation
  period, usually 3 to 12 months.

A report needs a defined system boundary, management's description of the system,
the controls, and evidence that they operated. A policy document alone is not
evidence.

## 2. Suggested scope

| Component | In scope |
| --- | --- |
| Security (common criteria) | Yes |
| Availability | Yes |
| Confidentiality | Yes |
| Processing integrity | Optional; relevant to AI output |
| Privacy | Optional; recommended because of patient data |

System boundary: the Pixtooth API, clinic web app, admin app, database, email and
AI subprocessors, and the maintainer's development and deployment pipeline. The
deploying practice's own network and endpoints stay outside.

## 3. Common criteria readiness

| Criterion | Intent | Current evidence | Gap | Status |
| --- | --- | --- | --- | --- |
| CC1.1 | Integrity and ethical values | Apache-2.0, `CONTRIBUTING.md`, `SECURITY.md` | No code of conduct or annual acknowledgement | Partial |
| CC1.2 | Board or owner oversight | Single maintainer | No independent oversight body | Planned |
| CC1.3 | Roles, reporting lines, authority | PIX-SEC-01 role table | No signed role assignments or org chart | Partial |
| CC1.4 | Competence and training | Public code review and tests | No training record or competence matrix | Planned |
| CC1.5 | Accountability | Code owners and review | No performance or compliance accountability record | Partial |
| CC2.1 | Internal communication of objectives | Policies in this directory | No acknowledgement record | Partial |
| CC2.2 | Internal communication of responsibilities | PIX-SEC-01, PIX-SEC-02 | No onboarding communication | Partial |
| CC2.3 | External communication | `SECURITY.md`, README, issue tracker | No status page or customer commitment | Partial |
| CC3.1 | Risk assessment process | PIX-SEC-03 | No annual workshop or approval | Partial |
| CC3.2 | Fraud risk | Not assessed | No fraud scenario in the register | Planned |
| CC3.3 | Change risk | PIX-SEC-05 review triggers | No formal impact analysis | Partial |
| CC3.4 | Risk from significant change | Reviewed ad hoc | No trigger checklist or sign-off | Planned |
| CC4.1 | Monitoring and evaluation | Tests, CI, logs | CI manual; no control monitoring | Partial |
| CC4.2 | Remediation of deficiencies | Issue tracker | No tracked deficiency log or SLA | Planned |
| CC5.1 | Control activities selection | This pack | No control matrix tied to risks | Partial |
| CC5.2 | Technology general controls | Auth, authorization, backups documented | Backup and retention not operating | Partial |
| CC5.3 | Policies and procedures | Policy set | Not approved or acknowledged | Partial |
| CC6.1 | Logical access boundary | Clinic scoping, roles, admin allowlist | No MFA | Partial |
| CC6.2 | Registration and authorization | Account lifecycle in PIX-SEC-02 | No approval workflow for admins | Partial |
| CC6.3 | Role-based access and least privilege | Role checks in code | No periodic access review evidence | Partial |
| CC6.4 | Physical access | Cloud provider | Operator evidence required | Deploying organization |
| CC6.5 | Access removal | Disable revokes refresh tokens | Offboarding evidence and token expiry window | Partial |
| CC6.6 | Authentication | bcrypt, JWT, rate limiting | No MFA, long refresh lifetime | Partial |
| CC6.7 | Transmission and disposal | TLS, deletion endpoints | No retention automation or media disposal | Partial |
| CC6.8 | Malicious software | Managed runtimes | No endpoint or upload scanning | Deploying organization |
| CC7.1 | Configuration and vulnerability monitoring | Pinned dependencies | No scanning, SBOM or baseline | Planned |
| CC7.2 | Security event monitoring | Console and platform logs | No alerting or audit trail | Planned |
| CC7.3 | Incident evaluation | PIX-SEC-08 | Never exercised | Planned |
| CC7.4 | Incident response | PIX-SEC-08 | No incident record or notification test | Planned |
| CC7.5 | Recovery from incidents | PIX-SEC-10 | Restore never tested | Planned |
| CC8.1 | Change management | Pull requests, tests, DCO | CI manual; branch protection undocumented | Partial |
| CC8.2 | Infrastructure change | Deploy scripts and IaC | No approved baseline or drift detection | Partial |
| CC8.3 | Software development | Tests and review | No SAST or security requirements per feature | Partial |
| CC9.1 | Risk mitigation | Risk register | No insurance or formal acceptance for all risks | Partial |
| CC9.2 | Vendor management | PIX-SEC-07 | No signed DPAs or vendor reviews | Planned |
| A1.1 | Capacity | Provider autoscaling | No capacity plan or load test | Partial |
| A1.2 | Environmental protection | Cloud provider | Operator evidence required | Deploying organization |
| A1.3 | Recovery testing | PIX-SEC-10 | Never tested | Planned |
| C1.1 | Confidentiality identification | PIX-DP-01 | No data classification labels | Partial |
| C1.2 | Confidentiality disposal | Deletion endpoints | Backups and logs not covered | Partial |
| PI1.1 | Processing integrity | Model card and tests | No numeric validation or monitoring | Planned |
| P1–P8 | Privacy criteria | PIX-DP-01, PIX-DP-02 | Notice, consent, DSR evidence missing | Planned |

## 4. Evidence to collect

| Area | Evidence | Frequency |
| --- | --- | --- |
| Access | User list, role assignments, access review sign-off | Quarterly |
| Authentication | MFA enforcement report, failed-login alerts | Monthly |
| Change management | Pull requests, approvals, CI results, release notes | Per change |
| Vulnerability | Scan results, remediation tickets, exception approvals | Monthly |
| Incident | Incident log, post-incident reviews, notification records | Per incident |
| Backup | Backup success report, restore test record | Monthly and quarterly |
| Availability | Uptime, error rate, capacity review | Monthly |
| Vendor | DPA, security review, certification scope | Yearly |
| Training | Acknowledgement of policies, security awareness completion | Yearly |
| Risk | Risk register review, treatment status | Quarterly |

## 5. Path to a report

1. Fix the critical gaps: MFA, audit trail, CI on pull requests, retention and
   tested restore.
2. Publish the system description and the control matrix.
3. Operate the controls for at least three months and keep evidence.
4. Engage a CPA firm for a readiness assessment, then a Type I.
5. Run a Type II observation period, typically 6 to 12 months.
6. Address exceptions and reissue yearly.

A Type I can be achieved earlier, but it attests only to design. Buyers usually
ask for Type II.

## 6. Related documents

- [Compliance index](./README.md)
- [Statement of applicability](./statement-of-applicability.md)
- [Risk register](./risk-register.md)
- [Change management](./change-management.md)
- [Audit logging](./audit-logging.md)
- [Backup and recovery](./backup-and-recovery.md)
- [Supplier register](./supplier-register.md)
