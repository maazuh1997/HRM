# HRM Locked Product Requirements

This document is the product source of truth. Implementation must not weaken these requirements without an explicit product decision.

## Commercial model

- 6-month license
- 1-year license
- Valid license required for SaaS and self-hosted deployments
- Cryptographically signed licenses
- Renewal required after expiration
- License entitlements and usage limits
- Grace/restricted-mode strategy
- License activation, renewal, suspension and revocation

## Deployment

- Cloud SaaS
- Customer-hosted/self-hosted
- Customer PostgreSQL supported
- Customer storage supported
- Customer SMTP supported
- Customer AI provider supported
- Docker-based deployment
- Same core application across deployment models

## Users and tenancy

- Solo HR workspace
- Company organizations
- Multiple HR users per company
- Collaboration and shared visibility
- Employee self-service
- Multi-tenant architecture
- Granular RBAC
- Server-side authorization
- Entitlement-aware authorization

## HR domains

Identity, organizations, employees, departments, teams, locations, recruitment/ATS, jobs, candidates, applications, interviews, offers, onboarding, offboarding, leave, attendance, documents, tasks, approvals, performance, goals, training, assets, compensation/payroll architecture, notifications, automation, AI, reporting and analytics.

## Engineering

- TypeScript-first
- API versioning
- PostgreSQL
- Background jobs
- Audit logs
- Provider abstractions
- Automated tests
- CI/CD
- Responsive desktop/tablet/mobile UX
- Accessibility
- Premium B2B SaaS design
- Strong loading, empty, error and success states
- No secrets in source control
- Prefer open-source/free-tier technologies
- Avoid unnecessary vendor lock-in

## Definition of done

A feature is not complete when only its UI works. Appropriate database, API, authorization, validation, responsive UX, accessibility, audit, automation, notification, testing, documentation, CI and deployment implications must be considered and implemented.
