# Licensing and compliance

This document describes the open-source licensing of the repository and the
practical steps that go with it. It is not legal advice; a deployment that
handles real patient data needs its own legal and data-protection review.

## Project license

Pixtooth is licensed under the **Apache License 2.0**. The full text is in
[LICENSE](../LICENSE); attribution notices are in [NOTICE](../NOTICE).

Apache 2.0 allows commercial and private use, modification and distribution. It
requires that redistributors:

- include a copy of the license
- keep the `NOTICE` file and its attribution notices
- state which files were modified when they distribute a modified version
- do not use the project name or logos to imply endorsement (the license grants
  no trademark rights)

The license also includes an express patent grant and a patent retaliation
clause, which is why it is a better fit than MIT for a product that may be
distributed commercially.

## Contributions

Contributions are accepted under the same license. `CONTRIBUTING.md` asks for a
Developer Certificate of Origin sign-off on every commit, which records that the
contributor has the right to submit the code. Keep the sign-off trailer when
rebasing or squashing.

## Third-party dependencies

Production dependencies run under permissive licenses only:

| License | Packages |
| --- | --- |
| Apache-2.0 | AWS SDK for JavaScript v3 and Smithy packages |
| MIT | Express, body-parser, cors, helmet, jsonwebtoken, pg, serverless-http, uuid, React, React DOM, React Router, Zustand, Immer, date-fns, tailwind-merge, react-icons |
| ISC | lucide-react |
| BSD-2-Clause | dotenv |
| BSD-3-Clause | bcryptjs |

`npm run check:licenses` walks the production dependency trees of the backend
and the frontend and fails on a license outside the allowlist. CI runs it as
part of `npm run ci`.

Development-only tooling includes MPL-2.0 (`lightningcss`) and
LGPL-3.0-or-later (`@img/sharp-libvips`, pulled in by Wrangler). Those packages
are build tools and are not part of the deployed frontend, API artifact or
container image; keep them in `devDependencies` and do not import them from
runtime code.

The ML pipeline in `apps/ml` downloads model weights and Python packages under
their own licenses. Record the license of any model or dataset you add before
shipping it; model weights are not covered by the repository license.

## Distribution checklist

When you publish a build, include the license and notice with it:

- source archive: ship `LICENSE`, `NOTICE` and this repository as-is
- Lambda artifact: `scripts/build-lambda-artifact.mjs` copies `LICENSE` and
  `NOTICE` into `deploy/lambda/build/`
- container image: the Dockerfile copies `LICENSE` and `NOTICE` into `/app`
- frontend-only bundle: the license and notice are served from the repository;
  add them to the release notes or the site's legal page

If you modify files, keep the copyright notices and add a short note describing
the change in the distribution.

## Trademarks

The Apache 2.0 license does not grant permission to use the Pixtooth name,
logo or product imagery. Forks may describe themselves as "based on Pixtooth"
but must not present themselves as the official product.

## Patient data

The application stores patient records, dental history and X-ray analysis
results. Under the GDPR, health data is a special category (Article 9) and
needs an explicit legal basis, a data processing agreement with every hosting
provider, and a record of processing activities.

Technical measures in the codebase:

- JWT sessions, hashed passwords and per-clinic authorization on API routes
- rate limiting, security headers and a content security policy
- `no-store` caching for API responses
- configuration status that reports presence, never secret values
- patient and clinic deletion endpoints

Operational work that remains outside the codebase:

- a retention policy for records, X-rays and logs, with automated deletion
- encrypted backups and a tested restore procedure
- an audit trail for access to patient records, with its own retention
- a data subject request process (export, correction, deletion)
- a data protection impact assessment and a breach notification procedure
- hosting in a region acceptable to the practice, with a signed DPA

Do not describe the application as GDPR-, HIPAA- or MDR-compliant until those
operational controls and the applicable legal review are in place.

## Security

Report vulnerabilities through the process in [SECURITY.md](../SECURITY.md).
Do not include patient data or credentials in a report.
