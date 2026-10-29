# Information security policy

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-01 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Purpose

This policy sets the security objectives and rules for the Pixtooth software and
for the maintainers who develop and distribute it. It gives a deploying
organization a baseline to adopt and extend for its own operations.

A requirement in this policy is an intention. Whether a control operates is
recorded in the [statement of applicability](./statement-of-applicability.md) and
in the [risk register](./risk-register.md), never assumed from this text.

## 2. Scope

In scope:

- the source code, build pipeline and release artifacts of `apps/backend`,
  `apps/frontend`, `apps/admin` and `apps/ml`
- the deployment templates in `deploy/`, `docker-compose.yml`, `k8s/` and `worker/`
- maintainer access to source control, CI, cloud accounts and model hosting
- the data flows described in [data-protection.md](./data-protection.md)

Out of scope, owned by the deploying organization:

- physical premises, workstations, networks and clinical devices
- employment screening, contracts, training and disciplinary process
- clinical decisions and the legal basis for processing patient data
- hosting contracts, backups of the deployed instance and local retention

## 3. Objectives

1. Protect the confidentiality, integrity and availability of patient and
   account data.
2. Prevent unauthorized access to clinics, patient records and platform
   administration.
3. Keep the software free of known exploitable vulnerabilities within the
   remediation targets in [vulnerability-management.md](./vulnerability-management.md).
4. Detect, respond to and learn from security incidents.
5. Meet the legal and contractual obligations that apply to the project and
   support deploying organizations in meeting theirs.
6. Keep the AI component documented, monitored and subject to human review.

## 4. Roles and responsibilities

| Role | Responsibilities |
| --- | --- |
| Project maintainer | Owns this policy, the risk register and the secure development process; approves releases; handles private vulnerability reports |
| Code owner | Reviews changes in the owned paths, approves dependency and architecture changes |
| Deploying organization | Owns hosting, identity lifecycle, backups, retention, incident response, supplier contracts and clinical governance |
| Platform administrator | Manages accounts through the admin app; cannot disable or delete the account currently in use |
| Clinic owner or administrator | Manages clinic membership and invitations within their clinic |
| Medic | Accesses only the patients and clinics they are authorized for |

A single person may hold more than one role in a small deployment. Where duties
conflict, the deploying organization documents the compensating control.

## 5. Policy statements

### 5.1 Risk management

Security work is prioritized by the risk register. Risks are scored before
treatment, reviewed at least every six months and whenever a data flow, supplier
or model changes. Accepted risks have an owner, a rationale and an expiry date.

### 5.2 Least privilege

Accounts receive the minimum access needed for their role. Platform
administration is limited to the addresses in `PLATFORM_ADMIN_EMAILS`. Clinic
data is scoped to active clinic membership. Privileged actions are logged once
the audit trail in [audit-logging.md](./audit-logging.md) is implemented.

### 5.3 Secure development

Changes go through a pull request, review by a code owner and the automated
checks in [change-management.md](./change-management.md). Secrets never enter
the repository. Production dependencies pass the license allowlist. Security
tests cover authentication, authorization, tenant isolation and input handling.

### 5.4 Data protection

Patient data is health data under GDPR Article 9. The deploying organization is
the controller and defines the legal basis, retention and patient notice. The
software minimizes collection, scopes access by clinic, avoids caching API
responses and exposes configuration presence without values. See
[data-protection.md](./data-protection.md) and [dpia.md](./dpia.md).

### 5.5 Cryptography

Passwords are hashed with bcrypt. Session tokens are signed JWTs with a short
access lifetime and rotating refresh tokens stored as hashes. Traffic uses TLS.
Data at rest relies on the database and object storage encryption of the hosting
provider. Key ownership, rotation and KMS configuration belong to the deploying
organization.

### 5.6 Logging and monitoring

Authentication failures, administrative actions, patient record access and AI
analyses are security-relevant. The required events and the current gap are in
[audit-logging.md](./audit-logging.md). Application logs must not contain
passwords, tokens, patient identifiers or image content.

### 5.7 Incident management

Security events are triaged, contained and documented under
[incident-response.md](./incident-response.md). Confirmed personal data breaches
are notified by the controller within 72 hours. Suspected medical device
incidents follow the MDR timeline in the same document.

### 5.8 Suppliers

Cloud, email, identity and AI suppliers are listed in
[supplier-register.md](./supplier-register.md) with the data they receive. A
supplier that processes patient data requires a data processing agreement and a
transfer mechanism before production use.

### 5.9 Business continuity

Backups, restore tests and recovery targets are defined in
[backup-and-recovery.md](./backup-and-recovery.md). The application must remain
usable when email or AI is unavailable: email degrades to a logged failure and
AI falls back to packaged detections.

### 5.10 Compliance and licensing

The project is distributed under Apache-2.0 with a `NOTICE` file. Production
dependencies are checked against an allowlist in CI. The project name and logo
are not granted for endorsement. Legal and regulatory requirements that apply to
the operator are tracked by the operator.

### 5.11 Awareness and reporting

Contributors and operators must know how to report a vulnerability through
[SECURITY.md](../../SECURITY.md) and how to report a security event internally.
Reports must exclude patient data and credentials.

## 6. Exceptions

An exception to this policy needs a recorded risk, an owner, a compensating
control and an expiry date. Exceptions are reviewed with the risk register.
There is no permanent exception for missing authentication, missing tenant
isolation or unpatched critical vulnerabilities.

## 7. Review

This policy is reviewed at least every six months and after a material change to
architecture, data flows, suppliers or the AI model. The review records the
date, the reviewer, the changes and any new risks.

## 8. Related documents

- [Access control policy](./access-control-policy.md)
- [Risk register](./risk-register.md)
- [Statement of applicability](./statement-of-applicability.md)
- [Incident response plan](./incident-response.md)
- [Data protection register](./data-protection.md)
- [AI governance](./ai-governance.md)
