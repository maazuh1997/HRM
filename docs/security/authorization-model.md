# Authorization Model

Authorization is always evaluated on the server.

```text
Authenticated User
      ↓
Organization Membership
      ↓
Membership Status
      ↓
Roles
      ↓
Permissions
      ↓
Resource + Action
```

Every protected request must establish an organization context before accessing tenant-owned resources.

The web application may hide controls for usability, but this is never a security boundary.

Permission matching supports organization-scoped permissions and a controlled wildcard resource for platform-level administration. `manage` grants the requested action for the same resource.

Future resource-level scopes must be evaluated after the base permission check and before the resource operation executes.

License and entitlement checks are separate concerns and must be evaluated by the application authorization pipeline where a feature or usage limit requires them.
