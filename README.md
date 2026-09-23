# URL Shortener

A full-stack URL shortener built with **Express 5**, **MongoDB**, and **EJS**, featuring JWT authentication, role-based authorization (NORMAL / ADMIN), click tracking, and an admin dashboard.

## Features

- **Signup / Login** — passwords bcrypt-hashed; session via JWT stored in an `httpOnly` cookie (30-day expiry)
- **Shorten URLs** — generates a random 8-character alphanumeric short ID (nanoid)
- **Redirect + tracking** — visiting a short link 302-redirects and records a click timestamp
- **Personal dashboard** — logged-in users see only their own URLs on the home page
- **Analytics API** — owner-only JSON endpoint with total clicks and visit history
- **Roles** — `NORMAL` users and `ADMIN`s; role is assigned server-side only (never accepted from the signup request)
- **Admin dashboard** — `ADMIN`-only page listing **all** shortened URLs with a *Created By* column (owner name + email)

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Runtime  | Node.js (ES modules)                    |
| Web      | Express 5                               |
| Database | MongoDB + Mongoose                      |
| Views    | EJS                                     |
| Auth     | JWT (`jsonwebtoken`) + bcrypt + cookies |
| Short ID | nanoid                                  |

## Prerequisites

- **Node.js 18+** (tested on Node 24)
- **MongoDB** running locally (default URI: `mongodb://127.0.0.1:27017/short-url`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file from the template
cp .env.example .env
#    then edit .env and set a strong JWT_SECRET_KEY

# 3. Make sure MongoDB is running, then start the server
npm run dev      # development (auto-reload)
# or
npm start        # production
```

The app listens on **http://localhost:8001**.

### Environment Variables

| Key              | Required | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `JWT_SECRET_KEY` | yes      | Secret used to sign/verify JWTs                                    |
| `NODE_ENV`       | no       | Set to `production` to enable the `Secure` flag on cookies         |

`.env` is gitignored — never commit real secrets. Use `.env.example` as the template.

## Scripts

| Command     | Description                          |
| ----------- | ------------------------------------ |
| `npm start` | Run the server                      |
| `npm run dev` | Run with auto-reload (`node --watch`) |
| `npm test`  | Run the test suite (`node --test`)   |

## Routes

### Pages

| Method | Path            | Auth          | Description                                                     |
| ------ | --------------- | ------------- | --------------------------------------------------------------- |
| GET    | `/`             | public        | Home: URL form; own URL list if logged in, auth notice if not   |
| GET    | `/signup`       | public        | Registration form                                               |
| GET    | `/login`        | public        | Login form                                                      |
| GET    | `/logout`       | any           | Clears the JWT cookie and redirects home                        |
| GET    | `/admin/urls`   | **ADMIN only** | All shortened URLs with owner name + email (403 otherwise)      |

### API

| Method | Path                       | Auth             | Description                                        |
| ------ | -------------------------- | ---------------- | -------------------------------------------------- |
| POST   | `/user/`                   | public           | Create account `{ name, email, password }`; auto-login |
| POST   | `/user/login`              | public           | `{ email, password }` → sets JWT cookie            |
| POST   | `/url/`                    | NORMAL / ADMIN   | `{ url }` → creates short URL (responds with HTML) |
| GET    | `/url/analytics/:shortId`  | owner only       | JSON `{ totalClick, analytics }`                   |
| GET    | `/url/:shortId`            | NORMAL / ADMIN   | 302 redirect to original URL, records the visit    |

Unauthenticated requests to protected routes are redirected to `/login`; authenticated users without the right role receive **403 Unauthorized**.

## API Testing with curl

```bash
BASE=http://localhost:8001

# 1. Signup (auto-sets the JWT cookie in the response headers)
curl -i -X POST $BASE/user/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secret123"}'

# 2. Login, saving the cookie to a file for reuse
curl -i -c cookies.txt -X POST $BASE/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'

# 3. Create a short URL (uses the saved cookie; responds with rendered HTML —
#    grab the short ID from the "Generated Short Url" section of the body)
curl -b cookies.txt -X POST $BASE/url/ \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# 4. Click analytics for a shortId (owner-only, JSON)
curl -b cookies.txt $BASE/url/analytics/<shortId>

# 5. Follow a short link (302 redirect to the original URL)
curl -i $BASE/url/<shortId>

# 6. Admin dashboard — requires an ADMIN cookie (HTML response)
curl -i -c admin-cookies.txt -X POST $BASE/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}'
curl -b admin-cookies.txt $BASE/admin/urls
```

> **Tip:** if you are not logged in, `curl -c cookies.txt` on login is the easiest way to capture the session cookie; send it back with `-b cookies.txt`.

## Roles & Creating an Admin

- Signup always creates users with role **`NORMAL`** — the role is never read from the client request, so no one can self-register as an admin.
- To promote an existing user to admin, update the record directly in MongoDB:

```js
// in mongosh, connected to the short-url database
db.user.updateOne(
  { email: "you@example.com" },
  { $set: { role: "ADMIN" } }
)
```

- Then log out and log back in so the JWT picks up the new role (tokens last 30 days).

## Testing

```bash
npm test
```

Uses Node's built-in test runner — **no extra dependencies**. The suite covers:

- `test/auth.test.js` — JWT sign/verify: role in payload, 30-day expiry, tampered/expired/foreign tokens rejected
- `test/middleware.test.js` — `checkAuthentication` (cookie → `req.user`) and `restrictUser` (login redirect, 403 on wrong role, pass-through when allowed)
- `test/template.test.js` — `home.ejs`: admin *Created By* column visibility, owner fallback, auth-required and logged-in views

## Project Structure

```
├── index.js                 # App entry: middleware, routers, server boot
├── connection.js            # Mongoose connection helper
├── routes/
│   ├── static.js            # /, /signup, /login, /logout, /admin/urls
│   ├── user.js              # signup + login endpoints
│   └── url.js               # shorten, redirect, analytics
├── controllers/
│   ├── user.js              # signup/login logic (bcrypt, JWT cookie)
│   └── url.js               # URL creation, redirect, analytics
├── middlewares/
│   ├── handleAuth.js        # checkAuthentication (soft) + restrictUser (hard gate)
│   └── errorHandler.js      # Global Express error handler
├── models/
│   ├── user.js              # User schema (name, email, hashed password, role)
│   └── url.js               # URL schema (shortId, redirectUrl, visits, owner)
├── utils/
│   └── auth.js              # setToken / getUser (JWT helpers)
├── views/                   # EJS templates (home, signup, login)
├── public/                  # Static assets (style.css)
├── test/                    # node:test suite
├── .env.example             # Environment variable template
└── .env                     # Your real secrets (gitignored)
```

## License

ISC © Rubayed Ahmed Foysal
