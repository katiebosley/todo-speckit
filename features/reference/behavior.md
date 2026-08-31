# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev`.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

## Auth and sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login uses **username + password** (not email) | `POST /todo/login` | Feature 1 |
| Username normalized `trim().toLowerCase()` | User model hook + auth controller | Feature 1 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hash never returned | Register/login; user `defaultScope` | Feature 1 |
| New users receive role `worker` | User model default | Feature 1 |
| Session TTL is **24 hours**; JWT `expiresIn: 86400` | Auth controller + Session `expirationDate` | Feature 1 |
| Reuse a non-expired session for the same user on login | `createOrReuseSession` | Feature 1 |
| Logout revokes the server session (token cleared on the row) | `POST /todo/logout` + `authenticate` | Feature 1 |
| Missing/invalid/expired Bearer token → `401` `{ "message": "Unauthorized! …" }` | `authenticate` middleware | Feature 1 |
| Authenticated requests resolve `req.user.id` from the session | `authenticate` | Feature 1 |
| Client stores session in `localStorage` key `user` | `Utils.setStore` after login/register | Feature 1 |
| `401` on the client clears `user` and redirects to login | axios response interceptor | Feature 1 |
| Unauthenticated visitors cannot open non-auth routes | `router.beforeEach` | Feature 1 |
| Signed-in visitors on login/register are sent to home | `router.beforeEach` | Feature 1 |
| Registration email uses shared `emailRules` (required + format) | `frontend/src/config/validation.js` | Feature 1 |
| Duplicate username → `400` `"Username is already taken."` | Register controller | Feature 1 |
| Duplicate email → `400` `"Email is already registered."` | Register controller | Feature 1 |
| Invalid credentials → `401` `"Invalid username or password."` (same message either field) | Login controller | Feature 1 |
| Protected `GET /todo/lists` returns only the caller's lists | `authenticate` + `userId: req.user.id` | Features 1–2 |

## UI rules

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login and register use full-screen layout (no MenuBar) | `App.vue` `showMenuBar` | Features 1–2 |
| Auth errors use `<v-alert type="error">` | Login / Register views | Feature 1 |

## Lists

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| List `userId` is always `req.user.id` on create; body `userId` is ignored | List create controller | Feature 2 |
| Reads/updates/deletes scope with `userId: req.user.id` | `getAccessibleListOrNull` + `findAll` | Feature 2 |
| Cross-user list access → **`404`**, never `403` | List update/delete | Feature 2 |
| List names trimmed; empty/whitespace rejected | Controller + Dashboard form rules | Feature 2 |
| List name max **100** characters | Controller `400` + client rules | Feature 2 |
| Lists returned **alphabetically by name** | `findAll` `order: name ASC` | Feature 2 |
| Empty lists view copy: **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| MenuBar shows signed-in name and **Sign out**; hidden on login/register | `App.vue` + `MenuBar.vue` | Feature 2 |
| Home/dashboard is a single lists view (no sidebar split) | `Dashboard.vue` | Feature 2 |

## Todos

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Todo `userId` and `listId` come from the session and owned parent list | Todo create controller | Feature 3 |
| Parent list must belong to the caller before todo read/create | `getAccessibleListOrNull` | Feature 3 |
| Todo reads/updates/deletes scope with `userId: req.user.id` | `getAccessibleTodoOrNull` + `findAllByList` | Feature 3 |
| Cross-user todo or parent-list access → **`404`**, never `403` | Todo controllers | Feature 3 |
| Todo titles trimmed; empty/whitespace rejected | Controller + Dashboard form rules | Feature 3 |
| Todo title max **255** characters | Controller `400` + client rules | Feature 3 |
| New todos default to `completed: false` | Todo create | Feature 3 |
| Todos ordered incomplete first, then `createdAt` ascending | `findAllByList` + Dashboard `sortTodos` | Feature 3 |
| Deleting a list removes its todos | List `hasMany` Todo `onDelete: CASCADE` | Feature 3 |
| Empty items dialog copy: **"No todos in this list yet."** | `Dashboard.vue` | Feature 3 |
| **+ Add Item** is only inside the list-items dialog | `Dashboard.vue` | Feature 3 |
| Completed todos use struck-through / muted title | `Dashboard.vue` | Feature 3 |
