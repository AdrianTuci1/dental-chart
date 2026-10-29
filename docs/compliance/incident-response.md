# Incident response plan

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-08 |
| Version | 0.1 (draft) |
| Owner | Deploying organization; project maintainer for software vulnerabilities |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

> This plan has not been exercised. Risk R-14 tracks the tabletop exercise. The
> contact table below must be filled in by the deploying organization before it
> can be used.

## 1. Scope

An incident is any event that threatens the confidentiality, integrity or
availability of Pixtooth or the data it holds. This includes:

- unauthorized access to an account, clinic or the admin app
- loss, theft or exposure of patient data, backups or credentials
- ransomware, destructive change or data corruption
- a vulnerability being exploited in production
- a service outage that affects clinical work
- an AI output that contributes to patient harm or a wrong clinical decision
- a supplier breach that affects data sent to that supplier

## 2. Severity

| Level | Definition | Examples | First response |
| --- | --- | --- | --- |
| S1 Critical | Confirmed or likely breach of patient data, or clinical safety impact | Database exposed, admin account taken over, ransomware, wrong-site AI output used in care | Immediately, all hands |
| S2 High | Active intrusion or major outage without confirmed data loss | Stolen refresh token, API key abuse, region outage, email provider compromise | Within 1 hour |
| S3 Medium | Limited exposure or degraded service | Single account compromise contained, failed backup, AI provider outage | Within 4 hours |
| S4 Low | No confirmed exposure | Phishing attempt blocked, vulnerability with no exploit path | Within 1 business day |

When in doubt, start at S2. Severity can be raised during triage.

## 3. Roles

| Role | Responsibility | Fallback |
| --- | --- | --- |
| Incident Lead | Declares severity, coordinates, approves containment and closure | Deputy operator |
| Technical Lead | Investigates, contains, restores, preserves evidence | Senior engineer |
| Scribe | Keeps the timeline, decisions, evidence hashes and notifications | Any team member |
| Communications | Talks to the practice, patients, suppliers and authorities | Incident Lead |
| Legal and DPO | Advises on GDPR, MDR and contractual notification | External counsel |

One person may hold several roles in a small deployment. Record which roles were
combined in the incident log.

## 4. Phases

### 4.1 Detect

Sources: user reports, alerts, supplier notice, vulnerability report, audit log
anomaly, failed backup, clinical report. Record the time of detection in UTC.

### 4.2 Triage

Confirm whether the event is real, affected data, affected patients and whether
the service is still compromised. Assign severity and open an incident record
outside the production database. Do not paste patient data into tickets.

### 4.3 Contain

Short-term actions, chosen to preserve evidence:

- disable the affected account and revoke refresh tokens
- rotate JWT, refresh, database and provider secrets
- block the source at the edge
- isolate the database or take a snapshot before changes
- disable AI analysis if the model or provider is implicated
- stop email sending if the provider is compromised

Do not delete logs, rebuild the host or restore a backup before taking a
snapshot and recording the state.

### 4.4 Eradicate and recover

Remove the cause, patch the vulnerability, restore from a verified backup,
validate data integrity, re-enable access in stages and monitor for recurrence.
Record the recovery point and any data lost between the recovery point and the
incident.

### 4.5 Notify

| Recipient | When | Deadline | Owner |
| --- | --- | --- | --- |
| Supervisory authority | Personal data breach with risk to rights | 72 hours after awareness | Controller |
| Affected data subjects | Breach with high risk | Without undue delay | Controller |
| Practice and affected clinics | Any S1 or S2 | Immediately | Incident Lead |
| Modal, AWS, Cloudflare, Resend | Supplier-related incident | Per contract | Technical Lead |
| Notified body / competent authority | Medical device incident under MDR | 15 days general; 10 days for death or serious deterioration; 2 days for a serious public health threat | Manufacturer |
| AI Act market surveillance authority | Serious incident involving a high-risk AI system | 15 days general; sooner if required by the applicable article | Provider |
| Police | Criminal activity | As required by law | Legal |

Notification content: what happened, when, what data and how many people,
likely consequences, measures taken, contact point. Updates continue until
closure.

### 4.6 Post-incident

Within five business days: timeline, root cause, affected data, notification
decisions, cost, corrective actions with owners and dates. Add new risks to the
[risk register](./risk-register.md) and update this plan. Share lessons with
contributors without patient data.

## 5. Evidence

- Preserve raw logs, snapshots and request captures with UTC timestamps.
- Record a SHA-256 hash of each evidence file and store it separately.
- Keep a chain-of-custody note: who collected, when, from where, stored where.
- Restrict access to the incident channel and evidence store.
- Retain evidence until the incident and any legal action are closed.

## 6. Contacts

| Function | Name | Channel | Backup |
| --- | --- | --- | --- |
| Incident Lead | _to fill_ | _to fill_ | _to fill_ |
| Technical Lead | _to fill_ | _to fill_ | _to fill_ |
| DPO or privacy advisor | _to fill_ | _to fill_ | _to fill_ |
| Clinical lead | _to fill_ | _to fill_ | _to fill_ |
| Cloud provider support | AWS | Support console | Account manager |
| AI provider support | Modal | Support channel | Account manager |
| Email provider support | Resend or SMTP provider | Support channel | Account manager |
| Supervisory authority | _to fill_ | _to fill_ | _to fill_ |
| Cyber insurance | _to fill_ | _to fill_ | _to fill_ |

## 7. Communication principles

- State what is known, what is not known and when the next update will come.
- Do not speculate about cause or blame.
- Do not include patient identifiers in public statements.
- Keep a single approved spokesperson.
- Preserve the practice's ability to inform patients before public disclosure,
  unless the law requires otherwise.

## 8. Testing

| Test | Frequency | Evidence |
| --- | --- | --- |
| Contact list check | Quarterly | Dated list with acknowledgements |
| Tabletop exercise | Every 6 months | Scenario, participants, findings, actions |
| Restore test | Quarterly | See [backup-and-recovery.md](./backup-and-recovery.md) |
| Secret rotation drill | Every 6 months | Rotation log |
| Notification template review | Yearly | Approved templates |

## 9. Related documents

- [Information security policy](./information-security-policy.md)
- [Risk register](./risk-register.md)
- [Audit logging](./audit-logging.md)
- [Backup and recovery](./backup-and-recovery.md)
- [Data protection](./data-protection.md)
- [AI governance](./ai-governance.md)
