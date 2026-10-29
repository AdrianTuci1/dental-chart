# Audit logging specification

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-09 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Purpose

This document specifies the audit trail required for patient data access,
administrative actions and AI analyses. It also records the current state: the
application writes console logs and relies on hosting-platform logs. There is no
structured, queryable, tamper-resistant audit trail today. This is risk R-02.

## 2. Principles

- Record the event, the actor, the object and the outcome.
- Record reads of patient data, not only writes.
- Never record passwords, tokens, image bytes, patient names or free-text notes.
- Use UTC timestamps with milliseconds and a stable request identifier.
- Append only. No application role may update or delete an audit record.
- Keep audit data separate from the database it describes.
- Restrict reads to named roles and log those reads as well.

## 3. Event catalog

| Event | When | Required fields beyond the base schema |
| --- | --- | --- |
| `auth.register` | Account created | `outcome`, `source` |
| `auth.login.success` | Password or Google login succeeds | `method` |
| `auth.login.failure` | Wrong password, unknown user, disabled account | `reason` (no password) |
| `auth.refresh` | Refresh token rotated | `familyId` (hashed) |
| `auth.refresh.reuse` | Replay outside the grace window | `familyId`, `actionTaken` |
| `auth.logout` | Session ended | `familyId` |
| `auth.password.reset` | Reset completed | `method` |
| `account.disabled` | Admin disables an account | `targetAccountId`, `actorAccountId` |
| `account.enabled` | Admin enables an account | `targetAccountId` |
| `account.deleted` | Admin deletes an account | `targetAccountId`, `patientCount` |
| `admin.account.list` | Admin lists or searches accounts | `queryHash`, `resultCount` |
| `clinic.member.added` | Invitation accepted or member added | `clinicId`, `targetAccountId`, `role` |
| `clinic.member.removed` | Member removed | `clinicId`, `targetAccountId` |
| `clinic.ownership.transferred` | Ownership changes | `clinicId`, `fromAccountId`, `toAccountId` |
| `patient.created` | Patient record created | `clinicId`, `patientId` |
| `patient.read` | Patient or chart opened | `clinicId`, `patientId`, `fields` |
| `patient.updated` | Record changed | `clinicId`, `patientId`, `changedFields` |
| `patient.deleted` | Record deleted | `clinicId`, `patientId` |
| `patient.exported` | Record exported | `clinicId`, `patientId`, `format` |
| `ai.analyze` | Inference requested | `clinicId` if known, `modelVersion`, `outcome`, `durationMs`, `usedFallback` |
| `api_key.rotated` | Medic rotates an API key | `accountId`, `prefix` |
| `config.changed` | Security-relevant configuration changes | `setting`, `oldPresence`, `newPresence` (never values) |
| `audit.read` | Someone queries the audit trail | `queryHash`, `resultCount` |

`patientId` and `accountId` are internal identifiers. Names, emails and image
content stay out of the audit store.

## 4. Base schema

| Field | Type | Notes |
| --- | --- | --- |
| `eventId` | UUID v7 or ULID | Sortable and unique |
| `timestamp` | ISO 8601 UTC | Server clock, synchronized by the provider |
| `action` | string | From the catalog |
| `outcome` | `success`, `failure`, `denied` | |
| `actorId` | string or null | Internal account ID |
| `actorRole` | string or null | Role at the time of the action |
| `clinicId` | string or null | Tenant scope |
| `patientId` | string or null | Internal ID only |
| `targetId` | string or null | Account, invitation or object ID |
| `sourceIp` | string or null | Truncated where policy allows |
| `userAgent` | string or null | Truncated to 256 characters |
| `requestId` | string | Correlates with application logs |
| `reason` | string or null | Controlled vocabulary, no free text |
| `metadata` | object | Small, reviewed, no patient data |

## 5. Storage and integrity

Recommended design:

- Write events to an append-only store such as DynamoDB with a stream to S3
  Object Lock, or a dedicated audit table with no update or delete permission.
- Encrypt at rest with a customer-managed key where available.
- Enable versioning and object lock for the archive.
- Keep a daily digest hash of the previous day's events in a separate location.
- Expose a read-only query path to the operator and DPO.
- Alert on write failures; a failed audit write must fail the request it
  describes for high-risk actions, or be queued with a durable retry.

For PostgreSQL, use a separate schema or database, a role with `INSERT` and
`SELECT` only, and a trigger that rejects `UPDATE` and `DELETE`.

## 6. Retention and access

| Item | Value |
| --- | --- |
| Online retention | 12 months |
| Archive retention | 24 months, or the period required by the operator |
| Legal hold | Until the matter closes |
| Read access | Operator security role, DPO, platform administrator |
| Read logging | Every query is itself an `audit.read` event |
| Deletion | Only by the retention job after the period, with a recorded approval |

Audit records contain personal data (actor and IP). Their retention must be
documented in [data-protection.md](./data-protection.md) and balanced against
employee monitoring law.

## 7. Current state and gap

| Requirement | State |
| --- | --- |
| Structured event schema | Not implemented |
| Patient read events | Not implemented |
| Admin action events | Not implemented; only console errors |
| AI analysis events | Not implemented; telemetry records feature usage without model version |
| Append-only storage | Not implemented |
| Query interface | Not implemented |
| Retention job | Not implemented |
| Alerting on write failure | Not implemented |
| Existing logs | `console.log`/`console.error` plus hosting-platform logs |

Application logs currently include request paths and error stacks. They must be
reviewed for patient identifiers before they are exported or shared.

## 8. Implementation plan

1. Define the event catalog as code and a single `auditService.record()` entry
   point.
2. Emit events from the HTTP boundary and from the domain services that know the
   patient, clinic and actor.
3. Add the storage adapter for DynamoDB and PostgreSQL behind one interface.
4. Add redaction tests that fail if a password, token, email, patient name or
   image byte appears in an event.
5. Add a read-only query endpoint for the operator, guarded by a dedicated role.
6. Add the retention job and the digest.
7. Add alerts for write failures and for spikes in `auth.login.failure`,
   `auth.refresh.reuse` and `patient.read` volume.
8. Exercise a patient-access investigation end to end.

## 9. Acceptance criteria

- Opening a patient chart produces exactly one `patient.read` event with the
  correct actor, clinic and patient ID.
- Disabling an account produces `account.disabled` and the next refresh fails.
- No event contains a password, token, email address, patient name or image.
- An operator can answer "who accessed patient X between two dates" in under five
  minutes.
- Deleting an audit record through the application is impossible.
- A failed audit write is visible in monitoring within five minutes.

## 10. Related documents

- [Access control policy](./access-control-policy.md)
- [Incident response](./incident-response.md)
- [Data protection](./data-protection.md)
- [Risk register](./risk-register.md)
