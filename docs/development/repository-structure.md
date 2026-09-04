# Repository Structure

The repository uses a workspace-oriented monorepo structure. Keep deployable applications separate from reusable packages and infrastructure concerns.

```text
apps/
  web/              # Next.js web application
  api/              # NestJS API

packages/
  config/           # Shared configuration and environment contracts
  database/         # PostgreSQL schema, migrations and database access
  auth/             # Authentication domain contracts
  authorization/    # RBAC and policy contracts
  licensing/        # License verification and entitlement contracts
  domain/           # Shared domain primitives and contracts
  ui/               # Shared accessible UI/design-system components
  validation/       # Shared schemas and validation contracts
  events/           # Domain events and event contracts
  providers/        # Replaceable infrastructure providers
  jobs/             # Background job contracts

infra/
  docker/           # Local and self-hosted container assets

config/
  ...

docs/
  product/
  architecture/
  design/
  security/
  development/
```

## Boundary rules

- `apps/web` owns presentation and browser interaction.
- `apps/api` owns HTTP/API composition and server-side application orchestration.
- Domain logic must not depend on UI code.
- Infrastructure providers must be accessed through explicit interfaces.
- Database access stays behind the database/data layer.
- Authorization is enforced in the API/domain boundary, never only in the web app.
- Tenant context must be explicit for tenant-owned operations.
- Shared packages should contain reusable contracts or primitives, not arbitrary business logic.
