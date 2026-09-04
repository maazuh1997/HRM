# Definition of Done

Every production feature must be evaluated across the complete lifecycle.

## Product

- User journey is clear
- Business rules are explicit
- Existing locked requirements remain intact

## Data and API

- Database model/migration is correct
- Tenant ownership is explicit
- API is versioned
- Input/output contracts are validated
- Errors are consistent

## Security

- Server-side authorization is enforced
- Tenant isolation is verified
- Sensitive data is protected
- Secrets are never committed
- Important actions are auditable

## UX

- Desktop experience is polished
- Tablet experience is usable
- Mobile experience is intentional
- Loading state exists
- Empty state exists
- Error state exists
- Success feedback exists
- Forms have useful validation
- Keyboard and accessibility behavior is considered

## Platform

- Background processing is used when appropriate
- Notifications are considered
- Automation/events are considered
- Provider abstraction is preserved
- SaaS and self-hosted deployment remain compatible

## Quality

- Unit/integration/E2E coverage is added where appropriate
- Type checking passes
- Lint passes
- Build passes
- CI remains healthy
- Documentation is updated when architecture or behavior changes

## Autonomous engineering rule

Do not ask for approval for routine engineering, UX, architecture, security, testing, or implementation decisions. Make the best professional decision using the master product specification. Ask only when a decision materially changes the business model, requires information only the product owner can provide, or has significant irreversible legal/commercial consequences.
