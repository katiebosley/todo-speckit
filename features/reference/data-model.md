# Data Model Reference

**Status:** Features 1–2 and 4.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required; editable via `PUT /todo/users/:id` (Feature 4) |
| `lName` | STRING | Required; editable via `PUT /todo/users/:id` (Feature 4) |
| `email` | STRING | Required, unique; editable via profile update (Feature 4) |
| `username` | STRING(100) | Required, unique; stored lowercase; editable via profile update (Feature 4) |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope; optional on profile `PUT` |
| `role` | STRING(20) | Default `worker`; read-only in profile API |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared (`""`) on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from session creation |
| `userId` | INTEGER FK | Required, references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- User hasMany Session (`userId`, cascade delete)
- Session belongsTo User (`userId`)
- User hasMany List (`userId`, cascade delete)
- List belongsTo User (`userId`)

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` | Feature 2 |
| Profile updates to `users` (no new tables) | Feature 4 |
