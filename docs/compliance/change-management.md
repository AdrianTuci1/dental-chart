# Change management and secure development

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-05 |
| Version | 0.1 (draft) |
| Owner | Project maintainer |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Scope

Changes to application code, dependencies, infrastructure templates, database
schema, configuration, deployment pipelines and the AI model.

## 2. Change types

| Type | Examples | Approval |
| --- | --- | --- |
| Standard | Documentation, tests, dependency patch with no behaviour change | Review by a code owner |
| Normal | Feature, schema change, new dependency, configuration change | Review plus passing checks |
| Major | Authentication, authorization, data model, AI model, supplier, public API | Review plus security and privacy review, release note |
| Emergency | Actively exploited vulnerability or production outage | Incident Lead approval, tests still required, retrospective within 5 days |

## 3. Pull request flow

1. Create a branch from `main` with a descriptive name.
2. Keep the change focused; separate refactors from behaviour changes.
3. Add or update tests for the changed behaviour.
4. Sign off the commit with `git commit -s` (Developer Certificate of Origin).
5. Open a pull request describing the change, the risk and how it was tested.
6. A code owner reviews. Authentication, authorization, patient data, crypto,
   AI and infrastructure changes need a second reviewer with that domain.
7. Resolve review comments; do not merge with an unresolved security objection.
8. Squash or merge according to the repository settings; keep the sign-off.

Security review is required when a change:

- adds or changes an authentication or authorization path
- adds a route, especially a public one
- changes tenant or clinic scoping
- adds a supplier, SDK or outbound data flow
- changes logging, retention or deletion
- changes the model, prompt, inference endpoint or training data
- changes secrets, IAM or deployment configuration

## 4. Automated checks

The intended gate before merge:

| Check | Command | State |
| --- | --- | --- |
| Frontend tests | `npm run test:frontend` | Implemented, manual |
| Frontend build | `npm run build:frontend` | Implemented, manual |
| Admin tests | `npm run test:admin` | Implemented, manual |
| Admin build | `npm run build:admin` | Implemented, manual |
| Backend tests | `npm run test:backend` | Implemented, manual |
| License allowlist | `npm run check:licenses` | Implemented, manual |
| Full local gate | `npm run ci` | Implemented |
| CI on pull request | GitHub Actions | **Not enabled**; workflow runs on `workflow_dispatch` |
| SAST, dependency and secret scanning | See [vulnerability-management.md](./vulnerability-management.md) | Not configured |

Risk R-09 tracks the missing pull-request trigger and branch protection. Until it
is fixed, the reviewer confirms that `npm run ci` passed locally and records the
result in the pull request.

## 5. Versioning and release

- Application releases use semantic versioning in `package.json` and a Git tag.
- The release note lists user-visible changes, security fixes, migrations and
  configuration changes.
- Build artifacts are produced from the tagged commit, not from a workstation.
- The SBOM is attached to the release once the SBOM step exists.
- Database changes must be backward compatible for one release so a rollback
  does not lose data.

## 6. Deployment

| Target | Command | Rollback |
| --- | --- | --- |
| Docker Compose | `docker compose up -d --build` | Redeploy the previous image tag |
| VPS | Release script in `docs/deployment-automation.md` | Switch the symlink to the previous release |
| AWS Lambda | `npm run deploy:lambda` | CloudFormation rollback or redeploy the previous artifact |
| Cloudflare Worker | `npm run deploy:worker` | `wrangler rollback` to the previous version |
| Frontend static host | Upload the previous `dist/` | Restore the previous deployment |

Before deployment:

- confirm the target environment and the configuration diff
- confirm a recent backup exists for a schema or data change
- confirm secrets are present without printing their values
- confirm the health endpoint and a login work in staging

After deployment:

- check `/health` and the database driver
- sign in and open a patient chart
- check the admin app if account handling changed
- watch errors and latency for 30 minutes
- record the deployed version and time

## 7. Database changes

- PostgreSQL schema changes ship with the code and run through the migration
  path; `DATABASE_AUTO_MIGRATE` defaults to true, so review the migration before
  deploying.
- DynamoDB is schemaless; changes must tolerate old documents and mixed versions
  during rollout.
- Destructive changes need a backup, a two-step release and a rollback plan.
- Never run an ad-hoc production query that changes data without a ticket and a
  second reviewer.

## 8. Emergency changes

An emergency change may bypass the normal review queue when a vulnerability is
being exploited or the service is down. The Incident Lead approves it, tests
still run, and a retrospective is completed within five business days. The
change is reviewed by a second person as soon as the incident is contained.

## 9. Separation of environments

Development, test and production use separate configuration, credentials and
data. Production patient data must not be copied to a development environment.
Tests use fixtures and synthetic data. The reference deployment does not enforce
this separation; the operator must.

## 10. Evidence

Keep for each production change:

- pull request and review approval
- CI result, or a manual test record while CI is manual
- deployment time, version and operator
- rollback decision, if any
- for major changes, the security and privacy review

## 11. Related documents

- [Vulnerability management](./vulnerability-management.md)
- [Incident response](./incident-response.md)
- [Information security policy](./information-security-policy.md)
- [Deployment automation](../deployment-automation.md)
