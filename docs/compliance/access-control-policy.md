# Access control policy

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-02 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Purpose

This policy defines who can access Pixtooth, how identity is proven, how access is
granted and removed, and which access paths still need work. It covers the
application roles and the accounts that operate a deployment.

## 2. Roles

| Role | Granted by | Can do | Cannot do |
| --- | --- | --- | --- |
| Medic (clinic member) | Registration or clinic invitation | Read and update patients in clinics where membership is active; manage own profile and API key | Read another clinic's patients; use platform administration |
| Clinic owner | Clinic creation or ownership transfer | Manage clinic details, members, invitations and deletion | Manage other clinics; use platform administration unless also listed as platform admin |
| Clinic administrator | Owner assigns the `admin` role | Manage clinic members and invitations | Transfer ownership; use platform administration |
| Platform administrator | Address listed in `PLATFORM_ADMIN_EMAILS` | List, inspect, disable, enable and delete accounts in the admin app | Disable or delete the account currently signed in |
| External API client | Medic API key | Create, update and delete that medic's external patients | Access the web session, admin routes or other clinics |
| Deploying operator | Infrastructure IAM | Read and change infrastructure, secrets and data | Nothing enforced by the application; governed by the operator's IAM |

The authoritative checks are in code: `requireAuth`, `requireSameMedicParam`,
clinic membership checks in `ClinicService`, and `requirePlatformAdmin`. A role
table in a document does not grant access.

## 3. Identity lifecycle

### 3.1 Registration

`POST /api/auth/register` is public and creates a medic account plus a personal
clinic. A deployment that should not accept public sign-ups must close
registration at the edge or add an invitation-only flow. That restriction is a
deploying-organization decision and is not implemented today.

### 3.2 Proof of identity

- Password accounts: bcrypt hash, never plaintext.
- Google accounts: OAuth identity linked by Google subject identifier.
- Password reset: single-use code with a 15-minute expiry, delivered by email.
- Account status: `active` or `disabled`; disabled accounts are rejected at
  login, refresh and `/auth/me`.

### 3.3 Sessions

| Item | Value | Notes |
| --- | --- | --- |
| Access token | JWT, 15 minutes by default | `JWT_EXPIRES_IN` |
| Refresh token | 365 days by default, rotated on use | `REFRESH_TOKEN_EXPIRES_IN` |
| Refresh reuse | Detected; a replay inside 10 seconds is treated as a second tab | `REFRESH_TOKEN_REUSE_GRACE_MS` |
| Revocation | Refresh tokens are revoked on password reset, account disable and account deletion | Access tokens remain valid until expiry |
| Storage | Refresh token hash in the database; token in browser `localStorage` | XSS would expose the session |

The long refresh lifetime is a deliberate usability trade-off for clinicians.
It raises the impact of a stolen browser profile. A shorter lifetime or device
binding is planned; see risk R-11.

### 3.4 Disable and delete

Disabling an account revokes its refresh tokens and blocks new logins. The
current access token stays valid until it expires, up to 15 minutes. Deleting an
account through the admin app removes the medic and their patients; the actor
cannot delete their own account. Backups and platform logs are not rewritten;
see risk R-16.

## 4. Authentication requirements

- Multi-factor authentication is **not implemented** for medics or platform
  administrators. This is risk R-01 and the highest-priority access gap.
- Passwords must meet the application's validation rules; the deploying
  organization should enforce a password manager and a minimum length in its own
  policy.
- Google OAuth is optional and configured with `GOOGLE_CLIENT_ID`.
- Login, registration, refresh and password reset are rate limited per client
  address, 60 requests per minute by default.
- The global API limit is 500 requests per minute by default.
- On Cloudflare Workers the rate-limit counters live in each isolate, so the
  effective limit is higher than configured. See risk R-13.

## 5. Authorization rules

- Patient and clinic routes require a valid access token.
- A medic may read or change only their own medic record (`requireSameMedicParam`).
- Clinic data requires active membership. Management actions require the owner
  or admin role.
- Platform administration requires an active account whose email is in
  `PLATFORM_ADMIN_EMAILS`. Disabling the account removes access even if the
  address stays in the list.
- The external API requires a medic API key and is limited to that medic's
  patients.
- `POST /api/ai/analyze` is currently public. Anyone who can reach the API can
  submit an image and consume inference capacity. This is risk R-03. It must be
  authenticated or restricted at the edge before production use.

## 6. Privileged access

- Platform administrator membership is configuration, not a database role.
  Changes go through the deployment configuration and a reviewed change.
- The admin app is a separate origin with `noindex` and should be restricted to
  the operator's network or an identity-aware proxy where possible.
- Infrastructure administrators use the cloud provider's IAM. The project
  recommends separate human identities, MFA on the provider account, no shared
  root credentials and short-lived sessions.
- The application cannot disable or delete the platform administrator account
  currently in use, which prevents a lockout.

## 7. Access reviews

| Review | Frequency | Owner | Evidence |
| --- | --- | --- | --- |
| Platform administrator list | Quarterly and on role change | Deploying organization | Configuration diff and approval |
| Clinic membership and invitations | Quarterly | Clinic owner | Member list export |
| Disabled and dormant accounts | Quarterly | Platform administrator | Admin app list filtered by status |
| Infrastructure IAM | Quarterly | Deploying organization | IAM report |
| API keys | On staff change and quarterly | Medic and operator | Rotation record |

Reviews are **not yet automated**. Until they are, the operator records the date,
the reviewer, the accounts removed and the reason.

## 8. Offboarding

1. Disable the account in the admin app; this revokes refresh tokens.
2. Remove clinic membership and reassign or delete owned patients according to
   the retention policy.
3. Rotate shared secrets and API keys the person could access.
4. Remove infrastructure and source-control access.
5. Record the completion date and the reviewer.

Access tokens expire within 15 minutes. For immediate termination, the operator
should also block the identity at the edge until the token expires.

## 9. Logging and monitoring

Authentication success and failure, administrative changes and patient record
access should be recorded under [audit-logging.md](./audit-logging.md). Today
only application console logs and hosting-platform logs exist, with no
structured audit trail. This is risk R-02.

## 10. Exceptions

Exceptions follow [information-security-policy.md](./information-security-policy.md).
An account without MFA, a shared account or a permanent administrator outside
the approved list needs a recorded risk acceptance with an expiry date.

## 11. Related documents

- [Information security policy](./information-security-policy.md)
- [Risk register](./risk-register.md)
- [Audit logging](./audit-logging.md)
- [Incident response](./incident-response.md)
- [Data protection](./data-protection.md)
