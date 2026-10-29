# Supplier and subprocessor register

| Field | Value |
| --- | --- |
| Document ID | PIX-SEC-07 |
| Version | 0.1 (draft) |
| Owner | Deploying organization; project maintainer for development suppliers |
| Last review | 2026-10-29 |
| Next review | 2027-04-29 |
| Classification | Public |

## 1. Purpose

This register lists every supplier that can receive Pixtooth data or affect the
software supply chain. A supplier that processes patient data needs a signed data
processing agreement and a transfer mechanism before production use. **No signed
agreement is stored in this repository.**

## 2. Register

| Supplier | Service | Data received | Region | Role | Agreement status | Review |
| --- | --- | --- | --- | --- | --- | --- |
| AWS | Lambda, DynamoDB, API Gateway, CloudWatch, KMS | All application data, logs, secrets in environment | Region chosen at deploy; DynamoDB defaults to `eu-central-1` | Processor | AWS DPA and SCCs available; operator must accept | Yearly |
| Cloudflare | Workers, CDN, DNS, WAF | Requests, headers, IPs, static assets; API traffic on Workers | Global edge | Processor | Cloudflare DPA available; operator must accept | Yearly |
| Stripe | Checkout, billing portal, subscription and invoice management | Account name and email, Stripe customer and subscription IDs, card and billing details entered on Stripe | Global; Stripe entity chosen by the operator | Processor for payments; independent controller for fraud and financial-record duties | Stripe DPA and SCCs available; operator must accept | Yearly |
| Modal | AI inference | Panoramic X-ray image, returned detections | To verify; likely United States | Processor | **Not verified**; DPA and transfer assessment required | Before AI use |
| Resend | Transactional email | Email address, name, invite and reset content | To verify; likely United States | Processor | **Not verified** | Before email use |
| Cloudflare Email | Transactional email alternative | Same as Resend | Global | Processor | Covered by Cloudflare DPA if used | Yearly |
| Gmail SMTP | Transactional email alternative | Same as Resend | Global | Processor | Google DPA if used | Yearly |
| Google | OAuth login | Email, subject identifier, name | Global | Processor | Google DPA available; operator must accept | Yearly |
| GitHub | Source control, CI, advisories | Source code, build logs, maintainer identity | United States | Processor | Microsoft DPA available | Yearly |
| npm registry | JavaScript packages | Package names and versions; no patient data | Global | Supplier | Terms accepted at publish and install | Yearly |
| PyPI | Python packages | Package names and versions; no patient data | Global | Supplier | Terms accepted at install | Yearly |
| Docker Hub | Container base images | No patient data | Global | Supplier | Terms accepted at pull | Yearly |
| Kaggle | Training dataset | Public radiographs; no live patient data | United States | Supplier | Dataset license **not documented** | Before training |

## 3. Due diligence checklist

For each supplier that touches patient data:

- [ ] legal entity and registered address identified
- [ ] data processing agreement signed, including confidentiality, breach
      notification, subprocessor rules, audit rights and deletion on exit
- [ ] processing region and data localisation confirmed
- [ ] transfer mechanism recorded (adequacy decision or SCCs plus a transfer
      impact assessment)
- [ ] security certifications reviewed (ISO 27001, SOC 2) and their scope checked
- [ ] retention of request bodies and backups confirmed in writing
- [ ] breach notification contact and deadline recorded
- [ ] exit plan: export format, deletion deadline and certificate
- [ ] insurance and financial stability checked for critical suppliers

For development-only suppliers, record the license, the version and the security
advisory channel.

## 4. AI-specific questions for Modal

1. In which region is inference executed, and can it be pinned to the EU?
2. Is the request body stored? For how long, and can retention be disabled?
3. Are images or derived data used to train or improve models?
4. Which subprocessors are involved, and where are they located?
5. What is the breach notification deadline?
6. Can the operator delete request data on demand?
7. Is there an audit log of requests that the operator can access?
8. What happens to data on contract termination?

Until these answers are recorded, AI analysis should be disabled for real patient
images. This is risk R-04.

## 5. Supply-chain licensing

The JavaScript production dependencies are checked against an allowlist by
`npm run check:licenses`. The Python and model stack is not yet covered by an
automated check.

| Component | License | Risk |
| --- | --- | --- |
| Ultralytics YOLO11 | AGPL-3.0 by default; commercial license available | **High**: AGPL obligations may extend to the distributed service. Confirm with counsel or buy a commercial license before distributing a combined work under Apache-2.0. |
| PyTorch, torchvision | BSD-3-Clause | Low |
| OpenCV | Apache-2.0 | Low |
| Pillow | HPND | Low |
| NumPy | BSD-3-Clause | Low |
| Matplotlib | PSF-based | Low |
| FastAPI | MIT | Low |
| Kaggle dataset | Not documented | **High**: provenance and redistribution rights unclear. See risk R-06. |
| Trained weights | Project license does not automatically cover them | Medium: record the terms before distribution |

This is a documentation finding, not a legal opinion. Resolve the Ultralytics and
dataset licensing before publishing a model artifact or a hosted service.

## 6. Review

Suppliers are reviewed yearly and when:

- a new supplier receives patient data
- a contract, region or subprocessor changes
- a supplier incident affects the service
- a certification expires or its scope changes

The review records the date, the reviewer, the evidence checked and any actions.

## 7. Related documents

- [Data protection](./data-protection.md)
- [DPIA](./dpia.md)
- [AI governance](./ai-governance.md)
- [Vulnerability management](./vulnerability-management.md)
- [Risk register](./risk-register.md)
