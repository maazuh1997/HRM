# HRM Architecture Principles

## Core

Build the HRM as a modular, domain-oriented application with explicit boundaries between product domains and infrastructure concerns.

## Tenancy

Every tenant-owned entity must have an explicit organization/tenant boundary. Tenant isolation is enforced server-side and tested independently.

## Authorization

Authorization follows:

Authentication -> Membership -> Role -> Permission -> Scope -> License -> Entitlement -> Resource -> Action

Frontend checks improve UX; backend checks are authoritative.

## Licensing

Licensing is separate from authentication and billing. License verification uses signed licenses. Private signing material exists only in the licensing infrastructure.

## Entitlements

Plans map to entitlements and usage limits. Product modules consume entitlement services rather than hardcoding plan names.

## Providers

External infrastructure is accessed through replaceable provider interfaces for AI, email, storage, payments, notifications and integrations.

## SaaS and self-hosting

The core application must run in both cloud and customer-hosted environments. Configuration determines infrastructure providers; business logic must not assume a single deployment topology.

## Async processing

Use background jobs for work that is slow, scheduled, retryable or resource-intensive.

## Events and automation

Domain events form the foundation for notifications and workflow automation. Event handlers should be idempotent where repeated delivery is possible.

## API

Public application APIs are versioned and use explicit contracts. Persistence models are not exposed directly as API contracts.

## Security

Security is designed into every domain. Avoid implicit trust between modules, tenants, users or infrastructure providers.

## Maintainability

Prefer clear module boundaries, explicit dependencies, strict typing and small cohesive units over clever abstractions.
