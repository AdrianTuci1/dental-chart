# Data protection register

| Field | Value |
| --- | --- |
| Document ID | PIX-DP-01 |
| Version | 0.1 (draft) |
| Owner | Project maintainer for the software description; deploying organization for the processing record |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Roles

| Party | Role | Notes |
| --- | --- | --- |
| Dental practice using Pixtooth | Controller | Decides why and how patient data is processed |
| Practice's staff and medics | Authorized users | Act under the controller's instructions |
| Operator hosting Pixtooth for a practice | Processor | Acts on documented instructions; needs a DPA |
| Project maintainer distributing the software | Software supplier | No access to a self-hosted instance's data |
| Project maintainer offering a hosted service | Processor or joint controller | Must be determined before launch; requires a DPA |

A self-hosted deployment keeps the maintainer outside the data flow. A hosted
offering changes the role and must be documented before the first patient record
is created.

## 2. Record of processing activities

| ID | Activity | Data subjects | Personal data | Special category | Purpose | Recipients | Retention | Security |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-01 | Account registration and login | Medics, clinic staff | Name, email, password hash, Google subject, status, timestamps, IP and user agent in logs | No | Authenticate users and secure accounts | Hosting provider, email provider | Account lifetime plus backup window | bcrypt, JWT, rate limiting, TLS |
| P-02 | Clinic membership and invitations | Medics, invitees | Name, email, role, invitation status | No | Share a workspace between colleagues | Email provider | Until invitation accepted or expired; membership until removed | Role checks, invitation token |
| P-03 | Patient records and dental chart | Patients | Name, identifiers, contact data, history, treatment plan, chart data, clinic, owner medic | **Yes, health data** | Record and support dental care | Hosting provider | Set by the practice under national law; **no automation today** | Clinic scoping, TLS, database encryption |
| P-04 | Panoramic X-ray analysis | Patients | Image content, possible burned-in identifiers or DICOM metadata, detections and confidence scores | **Yes, health data** | Assist the dentist with tooth segmentation and status suggestions | Modal (inference), hosting provider | Image is not stored by the backend; Modal retention must be confirmed | TLS, optional AI module, human review |
| P-05 | Transactional email | Medics, invitees, patients if the practice uses patient email | Email address, name, invite or reset content, delivery metadata | No | Invitations, password reset, test email | Resend, Cloudflare Email, Gmail SMTP, or the configured provider | Provider retention plus telemetry counters | TLS, provider DPA required |
| P-06 | Product telemetry | Medics | User ID, login count, first and last activity, time spent, visited menus, onboarding flags, email failure metadata | No | Understand feature adoption and delivery failures | Hosting provider | Until account deletion; no retention job | `ENABLE_TELEMETRY=false` disables it |
| P-07 | Security and operational logs | Users and visitors | IP address, user agent, request path, status, error stack, timestamps | No | Operate, debug and secure the service | Hosting provider | Platform default; operator sets it | Access limited to operators |
| P-08 | Platform administration | Medics | Account list, email, status, creation date, patient counts | No | Operate accounts and respond to abuse | Hosting provider | Admin action history is not persisted today | Admin allowlist, self-protection rules |
| P-09 | License billing | License buyers | Name, email, Stripe customer and subscription IDs, plan, status, billing interval, renewal date; card and billing details are entered on Stripe | No | Sell and manage the license, enforce the patient cap | Stripe | Subscription state until account deletion; Stripe keeps payment records under its own policy and tax law | Hosted checkout, signed webhooks, no card data stored by Pixtooth |

P-03 and P-04 are the activities that require the most care. P-04 sends a
health image to a third party and has no verified agreement or region in the
repository. See risk R-04.

## 3. Lawful basis

The controller selects and records the basis. Typical choices:

| Activity | GDPR basis | Notes |
| --- | --- | --- |
| Account and clinic administration | Article 6(1)(b) contract | Necessary to provide the service to the practice |
| Patient care records | Article 6(1)(c) legal obligation and Article 9(2)(h) health care | Requires professional secrecy and a legal basis under national law |
| AI-assisted image analysis | Article 9(2)(h) health care | The dentist remains responsible for the decision; patients must be informed |
| Security logging | Article 6(1)(f) legitimate interest | Necessary for network and information security |
| Telemetry | Article 6(1)(f) legitimate interest or consent | Must be optional where consent is the chosen basis |
| Transactional email | Article 6(1)(b) contract | Service messages, not marketing |

Marketing email is not implemented. Adding it requires a separate basis,
preference management and an unsubscribe path.

## 4. Retention

The application implements deletion endpoints but no scheduler. The table below
states the rule the operator must configure; the **Automated** column shows
whether the repository enforces it.

| Data | Rule | Automated |
| --- | --- | --- |
| Account record | Account lifetime, then delete; backups expire within 30 days | No; admin delete is manual |
| Patient record and chart | National dental record retention period, then delete or anonymize | No; patient delete is manual |
| X-ray image | Not stored by the backend; browser session only | Yes, by design |
| AI detections | Returned to the browser; not persisted server-side | Yes, by design |
| Modal request body | Contractual retention of the inference provider | No; contract not verified |
| Invitations and reset codes | Short expiry, then invalid | Partial |
| Refresh tokens | 365 days of inactivity by default, then TTL removal | Yes |
| Telemetry | Account lifetime; delete with the account | No; no retention job |
| Application logs | 30 days recommended for security logs, 90 days maximum unless required | No; platform default |
| Backups | 35 days recommended for point-in-time recovery | No; operator configures |

Deletion must cover the primary record, indexes, caches and any export. Backups
are not rewritten; the operator documents the maximum time until a deleted
record disappears from backups and suppresses it from restores.

## 5. Data subject requests

| Request | How | Target | Evidence |
| --- | --- | --- | --- |
| Access and copy | Export the patient record and chart; provide a machine-readable file | 1 month, extendable by 2 months | Request log, export file hash |
| Rectification | Correct the record through the app or admin | 1 month | Before and after values |
| Erasure | Delete the patient; delete the account where applicable | 1 month | Deletion confirmation, backup expiry date |
| Restriction | Disable access and stop processing; keep the record | 1 month | Access change record |
| Portability | JSON export of the record and chart | 1 month | Export file |
| Objection | Review the basis; stop the processing if it relies on legitimate interest | 1 month | Decision record |

Identity must be verified before disclosure. A request from a patient is
normally routed through the practice, which is the controller. The application
has no self-service export today; the operator performs it with a database query
and records the result.

Erasure has exceptions: legal retention of dental records, legal claims, and
records required by professional rules. The controller documents the exception
and informs the patient.

## 6. International transfers

| Recipient | Service | Location | Transfer mechanism |
| --- | --- | --- | --- |
| AWS | Lambda, DynamoDB, API Gateway, CloudWatch | Region chosen at deploy; `eu-central-1` is the default for DynamoDB | DPA and SCCs or an adequacy decision; verify the chosen region |
| Cloudflare | Workers, CDN, DNS | Global edge network | DPA and SCCs; verify data localisation |
| Modal | AI inference | To verify; likely United States | DPA and SCCs; transfer impact assessment required |
| Resend | Transactional email | To verify; likely United States | DPA and SCCs |
| Stripe | License billing and payments | Global; Stripe entity chosen by the operator | Stripe DPA and SCCs; no patient data is sent |
| Google | OAuth login | Global | Google DPA; only the subject identifier and email are used |
| GitHub | Source, CI, advisories | United States | Microsoft DPA; no patient data should reach CI |

No signed DPA is stored in this repository. The supplier register tracks the
status; a supplier that cannot sign a DPA must not receive patient data.

## 7. Transparency

The practice's patient notice should state:

- what data is recorded and why
- that an AI model assists with image analysis, what it outputs and that a
  dentist reviews every result
- who can access the record
- how long it is kept
- how to exercise rights and complain to the supervisory authority
- the subprocessors that receive data, including the AI provider

A draft notice belongs to the controller. The software repository cannot supply
the legal text for a specific practice.

## 8. Security measures

| Measure | Status |
| --- | --- |
| TLS in transit | Implemented at the hosting layer |
| Encryption at rest | Provider-managed; operator verifies |
| Password hashing | Implemented, bcrypt |
| Session revocation on disable and password reset | Implemented |
| Clinic-level authorization | Implemented |
| Audit trail for record access | Not implemented; risk R-02 |
| MFA | Not implemented; risk R-01 |
| Backup and restore | Documented, not tested; risk R-08 |
| Retention automation | Not implemented; risk R-07 |
| Supplier DPAs | Not verified; risk R-04 |

## 9. Breach handling

A personal data breach is handled under
[incident-response.md](./incident-response.md). The controller notifies the
supervisory authority within 72 hours of becoming aware, unless the breach is
unlikely to result in a risk to rights and freedoms. Affected data subjects are
informed without undue delay when the risk is high.

## 10. Related documents

- [DPIA](./dpia.md)
- [Incident response](./incident-response.md)
- [Supplier register](./supplier-register.md)
- [AI governance](./ai-governance.md)
- [Audit logging](./audit-logging.md)
