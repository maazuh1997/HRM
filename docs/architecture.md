# HRM Architecture

## Runtime model

The product is a modular monolith at the business-domain level with independently deployable runtime applications where operationally useful:

- `apps/web` — responsive customer-facing web application
- `apps/api` — authenticated API and domain orchestration
- `apps/worker` — asynchronous jobs, scheduled work, notifications, automation, and document processing

## Core domains

- Identity
- Organizations
- Memberships
- Roles and permissions
- Licensing
- Entitlements
- People
- Recruitment
- Onboarding
- Attendance
- Leave
- Documents
- Tasks
- Notifications
- Automation
- AI
- Reporting
- Billing
- Integrations
- Audit

## Deployment principles

The same application code must support cloud SaaS and customer-hosted deployments.

Infrastructure dependencies are provider abstractions rather than business-domain dependencies:

- PostgreSQL database
- Redis-compatible queue/cache
- Object storage
- SMTP/email
- AI provider
- Payment provider

Self-hosted installations configure these through environment variables and deployment configuration.

## Security boundary

Every protected request is evaluated through authentication, organization membership, authorization, license validity, entitlement checks, and resource scope before business data is accessed.

## Licensing boundary

The HRM application verifies signed licenses using a public verification key. License issuance and private signing keys belong to the separate licensing platform and are never shipped in the customer application.
