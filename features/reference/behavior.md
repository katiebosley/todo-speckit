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
| Protected `GET /todo/lists` returns only the caller's lists (none until Feature 2) | `authenticate` + empty list response | Feature 1 |

## UI rules

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login, register, and Feature 1 home use full-screen layout (no MenuBar) | `App.vue` | Feature 1 |
| Home shows a welcome using the user's first name and a **Sign out** button | `Home.vue` | Feature 1 |
| Auth errors use `<v-alert type="error">` | Login / Register views | Feature 1 |
