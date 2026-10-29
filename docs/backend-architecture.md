# Backend architecture

The API is a modular monolith. Each business capability is a module with its own
domain, application, infrastructure and HTTP layers, and the modules are wired together
in one composition root. The same code runs on the local Express process, on AWS Lambda
and on the Cloudflare Worker; only the host adapters differ. Paths in this document are
relative to `apps/backend/`.

## Modules (bounded contexts)

| Module | Responsibility | Owns |
| --- | --- | --- |
| `identity` | Medic accounts, authentication, sessions, API keys, Google linking, password recovery | `Medic`, `ApiKey`, `Password` |
| `clinic` | Workspaces, memberships, invitations, ownership | `Clinic`, `ClinicMembership` |
| `patients` | Patient records and their chart (completed history, treatment plan) | `Patient`, `PatientChart`, dental enums |
| `integration` | External API-key contract for patient upsert/delete | `ApiKeyAuthenticator` |
| `ai` | X-ray inference, fallback detections, sample assets | `AIService`, `AssetService` |
| `analytics` | Product telemetry attached to the account | `UserAnalyticsService` |
| `email` | Provider-agnostic email delivery (Resend, Cloudflare, Gmail) | `EmailService`, transports |

Shared code lives outside the modules:

- `shared/errors` — the `AppError` hierarchy (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ServiceUnavailableError`).
- `shared/http` — `asyncHandler`, the single error-to-HTTP mapper, and the Express error middleware.
- `shared/infrastructure` — the DynamoDB document client and `BaseRepository`.
- `shared/time` — duration parsing used by sessions.
- `http` — host-level concerns: security headers, cache policy, rate limiting, health, the Worker adapter.

## Layers and the dependency rule

```
http (controllers, middleware)
        ↓
application (use cases, orchestration)
        ↓
domain (entities, value objects, rules)
        ↑
infrastructure (DynamoDB repositories, external clients)
```

- **domain** has no framework, HTTP or storage imports. It holds the rules that must be
  true everywhere: what a public medic looks like, when a workspace is the default one,
  which roles may manage members, how the patient chart is assembled.
- **application** implements use cases. It receives repositories and collaborators
  through its constructor and throws `AppError` instances instead of returning status
  codes.
- **infrastructure** implements storage and external services. Repositories map the
  DynamoDB single-table layout (`PK`/`SK`, `data` flattening) to plain objects.
- **http** only translates: read the request, call one application method, write the
  response. No business rule and no try/catch loop lives here; `asyncHandler` forwards
  failures.

Dependencies point inward. A module reaches another only through an injected
collaborator: an application service (`ClinicService`, `PatientSeedService`), a narrow
port (`ClinicService.patientDirectory`), or a read-only repository (`MedicRepository`
for the owner lookup and the free-plan limit). Controllers and a module's own
infrastructure stay private, and the composition root supplies the cross-module
implementation. The one orchestration that spans modules is registration: `identity`
creates the account, asks `clinic` for the default workspace and `patients` for seed
data.

## Persistence

Repositories send a small document command set (put, get, delete, query, scan, update)
through `src/shared/infrastructure/documentClient.js`. `DB_DRIVER=dynamo` (the default)
uses the DynamoDB document client; `DB_DRIVER=postgres` uses
`src/shared/infrastructure/postgresDocumentClient.js`, which stores one row per `PK`/`SK`
in a `documents` table. The repository code does not branch on the driver. See
[docs/postgres-setup.md](./postgres-setup.md) for configuration and limits.

## Composition root

`src/container.js` instantiates repositories, services, the email and AI adapters, and
the API-key authenticator once. `src/routes/definitions.js` builds the module
controllers from that container. Route definitions stay declarative: path, middleware,
handler.

## Error model

Application and domain code throw named errors. Two adapters map them:

- Express: `shared/http/errorHandler.js`, mounted last in `src/http/expressApp.js`.
- Worker: `runRoute` in `src/http/workerApp.js`.

Both use `shared/http/errorMapper.js`, so the same failure produces the same status and
JSON body on every host. Unexpected errors answer `500`; in production the message is
generic and the detail stays in the server log.

## HTTP hosts

| Host | Entry | Adapter |
| --- | --- | --- |
| Local / VPS | `app.js` | `src/http/expressApp.js` |
| AWS Lambda | `lambda.js` | `serverless-http` around the same Express app |
| Cloudflare Worker | `worker/index.js` | `src/http/workerApp.js` request/response shim |

`src/routes/definitions.js` is the single route table. The Worker compiles the same
table, so a path exists on both hosts or on neither.

## Adding a feature

1. Put new rules in the module's `domain` as an entity method or value object.
2. Add the use case to the module's `application` service and inject what it needs.
3. Add or extend a repository in `infrastructure`; keep DynamoDB keys there.
4. Add a thin handler in `http` and a route in `src/routes/definitions.js`; wire it in
   `src/container.js` if it needs a new collaborator.
5. Cover the rule with a test. Route tests use `tests/helpers/inMemoryDynamo.js`.

## Conventions

- Files export one primary class or one factory; controllers are factories
  (`createXController`) so their dependencies are explicit.
- IDs and timestamps are produced in the application layer (`idGenerator`), not in the
  domain entities.
- Responses shaped for a screen belong in the HTTP layer; responses shaped for an API
  contract live in the application service that owns that contract.
- Telemetry and email delivery are best effort and never fail the request that caused
  them.
