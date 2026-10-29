# Backup and recovery

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-10 |
| Version | 0.1 (draft) |
| Owner | Deploying organization |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

> The repository describes how to back up and restore a deployment. It does not
> configure backups for a specific instance. Risk R-08 tracks the missing tested
> restore in the reference deployment.

## 1. Scope

| Data | Where it lives | Rebuildable |
| --- | --- | --- |
| Accounts, clinics, patients, charts, plans | DynamoDB table or PostgreSQL database | No |
| Refresh token hashes | Same database | No; users sign in again |
| Telemetry | Same database | No; acceptable to lose |
| Audit trail, once implemented | Separate audit store | No |
| Configuration and secrets | Environment, secret manager, `.env` | Partly; secrets must be reissued |
| Model weights and detections | Repository, Modal, object storage | Yes, from the release and training pipeline |
| Frontend and admin bundles | Container image or static host | Yes, from the repository |
| Email delivery history | Provider | No; provider-owned |

The database is the critical asset. Everything else is either reproducible or
replaceable.

## 2. Targets

| Asset | RPO | RTO | Method |
| --- | --- | --- | --- |
| DynamoDB | 5 minutes | 4 hours | Point-in-time recovery plus daily on-demand backup |
| PostgreSQL | 24 hours with daily dump; 5 minutes with WAL archiving | 4 hours | `pg_dump` plus WAL archive, or volume snapshots |
| Audit store | 5 minutes | 8 hours | Versioned, object-locked archive |
| Configuration | On change | 1 hour | Secret manager and infrastructure as code |
| Model artifacts | Per release | 1 day | Repository tag and model registry |
| Static assets | Per release | 1 hour | Rebuild from the repository |

RPO is the maximum acceptable data loss. RTO is the maximum acceptable downtime.
A practice with stricter clinical continuity needs should tighten these values.

## 3. DynamoDB

1. Enable point-in-time recovery on the table:
   `aws dynamodb update-continuous-backups --table-name <table> --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true`.
2. Schedule a daily on-demand backup with AWS Backup or an EventBridge task:
   `aws dynamodb create-backup --table-name <table> --backup-name <table>-YYYY-MM-DD`.
3. Copy backups to a second region if the practice requires regional survival.
4. Restore to a new table, never over the live table:
   `aws dynamodb restore-table-from-backup --target-table-name <table>-restore --backup-arn <arn>`.
5. Point the application at the restored table with `DYNAMODB_TABLE_NAME`,
   redeploy, and validate before switching traffic.
6. Record the backup ARN, the restore time and the validation result.

DynamoDB backups are encrypted with the table's key. Cross-account or
cross-region copies need the key policy to allow them.

## 4. PostgreSQL

Daily logical backup:

```bash
pg_dump --format=custom --no-owner --file=/backup/pixtooth-$(date +%F).dump "$DATABASE_URL"
age -r "$BACKUP_PUBLIC_KEY" -o /backup/pixtooth-$(date +%F).dump.age /backup/pixtooth-$(date +%F).dump
```

Keep 35 daily, 12 weekly and 12 monthly copies. Store them in a bucket with
versioning, object lock and a separate retention policy. For a lower RPO, enable
WAL archiving and test point-in-time recovery.

Restore into a new database:

```bash
createdb pixtooth_restore
pg_restore --no-owner --dbname=pixtooth_restore /backup/pixtooth-YYYY-MM-DD.dump
```

For Docker Compose, snapshot the `pixtooth-db` volume only after a clean stop, or
use the logical dump. A raw volume copy of a running database is not a reliable
backup.

## 5. Configuration and secrets

- Store production secrets in a secret manager, not in a repository or a shared
  note. See risk R-12 for Lambda environment variables.
- Keep an encrypted, access-controlled copy of the variable names and the
  rotation procedure. Never store the values in the same place as the database
  backup.
- After a restore, rotate JWT, refresh, database and provider secrets if there is
  any chance the old environment was exposed.
- Record the configuration version used for each release.

## 6. Restore test

Run quarterly and after any change to the backup configuration:

1. Choose a backup at random and record its timestamp.
2. Restore into an isolated environment with no production traffic.
3. Verify the schema version, row or item counts, and a sample of accounts,
   clinics, patients, charts and plans.
4. Sign in with a test account, open a patient chart, and confirm the admin app
   lists the account.
5. Measure the elapsed time and compare it with the RTO.
6. Delete the restored environment and any exported sample data.
7. Record the result, the backup used and the measured RTO.

A backup that has never been restored is a hypothesis. The test is the evidence.

## 7. Incident recovery

During an incident, take a snapshot before changing data, then follow
[incident-response.md](./incident-response.md). Record the recovery point and
the records lost between the recovery point and the incident. If patient data
was lost, the controller decides whether notification is required.

## 8. Current state

| Item | State |
| --- | --- |
| DynamoDB PITR | Not configured by the repository; operator must enable |
| Scheduled DynamoDB backup | Not configured |
| PostgreSQL dump schedule | Not configured |
| Backup encryption | Recommended; not enforced |
| Restore test | Never performed in the reference deployment |
| Documented targets | This document |
| Evidence retention | Operator |

## 9. Related documents

- [Incident response](./incident-response.md)
- [Data protection](./data-protection.md)
- [Risk register](./risk-register.md)
- [PostgreSQL setup](../postgres-setup.md)
- [Serverless deployment](../serverless-deployment.md)
