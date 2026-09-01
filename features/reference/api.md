# API Reference

**Status:** Features 1–4.

API mount path: `/todo` (`backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create a user account and session |
| `POST` | `/todo/login` | No | Authenticate and return or reuse a session |
| `POST` | `/todo/logout` | Yes | Revoke the current session token |
| `GET` | `/todo/lists` | Yes | Fetch lists owned by the authenticated user (A–Z by name) |
| `POST` | `/todo/lists` | Yes | Create a list owned by the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (title and/or `completed`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's profile (self only) |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's profile (self only) |

**Login / register success** (`201` register, `200` login) — flat JSON, no envelope:

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never included.

**Create list request:** `{ "name": "Groceries" }` (`userId` in the body is ignored).

**List success** (`200` / `201`):

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Errors:** `{ "message": "Human-readable explanation." }` with `400`, `401`, `404`, or `500`.  
**Not found / not owned:** `404` `{ "message": "List with id=<id> not found." }` or `{ "message": "Todo with id=<id> not found." }` or `{ "message": "User with id=<id> not found." }` (never `403`).

**Create todo request:** `{ "title": "Buy milk" }` (`userId` in the body is ignored).

**Todo success** (`200` / `201`):

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**Update profile request:** `{ "fName", "lName", "email", "username", "password?" }` (`password` optional; `role` is ignored).

**Profile success** (`200`):

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth register / login / logout | Feature 1 |
| List CRUD (`GET/POST/PUT/DELETE /todo/lists`) | Feature 2 |
| Todo CRUD (`GET/POST /todo/lists/:listId/todos`, `PUT/DELETE /todo/todos/:id`) | Feature 3 |
| Profile (`GET/PUT /todo/users/:id`) | Feature 4 |
