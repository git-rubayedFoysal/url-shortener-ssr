# URL Shortener

A full-stack URL shortener built with **Express 5**, **MongoDB**, and **EJS**, featuring JWT authentication, role-based authorization (NORMAL / ADMIN), click tracking, and an admin dashboard.

## Features

- **Signup / Login** — passwords bcrypt-hashed; **15-minute access token** + **30-day refresh token**, both in `httpOnly` cookies
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

## Routes

### Pages

| Method | Path            | Auth          | Description                                                     |
| ------ | --------------- | ------------- | --------------------------------------------------------------- |
| GET    | `/`             | public        | Home: URL form; own URL list if logged in, auth notice if not   |
| GET    | `/signup`       | public        | Registration form                                               |
| GET    | `/login`        | public        | Login form                                                      |
| GET    | `/logout`       | any           | Clears both auth cookies and redirects home                     |
| GET    | `/admin/urls`   | **ADMIN only** | All shortened URLs with owner name + email (403 otherwise)      |

### API

| Method | Path                       | Auth             | Description                                        |
| ------ | -------------------------- | ---------------- | -------------------------------------------------- |
| POST   | `/user/`                   | public           | Create account `{ name, email, password }`; auto-login |
| POST   | `/user/login`              | public           | `{ email, password }` → sets access + refresh cookies |
| POST   | `/user/refresh`            | refresh cookie   | Valid `refreshToken` cookie → new pair of cookies (rotates both); redirects to `/login` on failure |
| POST   | `/url/`                    | NORMAL / ADMIN   | `{ url }` → creates short URL (responds with HTML) |
| GET    | `/url/analytics/:shortId`  | owner only       | JSON `{ totalClick, analytics }`                   |
| GET    | `/url/:shortId`            | NORMAL / ADMIN   | 302 redirect to original URL, records the visit    |

Unauthenticated requests to protected routes are redirected to `/login`; authenticated users without the right role receive **403 Unauthorized**.

### Authentication model

| Cookie          | Lifetime   | Used for                                              |
| --------------- | ---------- | ----------------------------------------------------- |
| `token`         | 15 minutes | Sent on every request; verified by `checkAuthentication` |
| `refreshToken`  | 30 days    | Sent only to `POST /user/refresh` to obtain a new access token |

Both cookies are `httpOnly` (JavaScript can't read them), `SameSite=Lax`, and `Secure` when `NODE_ENV=production`. The refresh JWT carries a `type: "refresh"` claim, so it is rejected everywhere except the refresh endpoint (and vice versa). Refreshing rotates **both** cookies — a sliding session that lasts while the user stays active.

## API Testing with curl

```bash
BASE=http://localhost:8001

# 1. Signup (auto-sets both cookies: token + refreshToken)
curl -i -X POST $BASE/user/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secret123"}'

# 2. Login, saving both cookies to a file for reuse
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

# 6. Refresh — exchange the refresh cookie for a new pair (rotates both;
#    -c - prints AND saves the updated Set-Cookie headers back to the file)
curl -i -c cookies.txt -b cookies.txt -X POST $BASE/user/refresh

# 7. Admin dashboard — requires an ADMIN cookie (HTML response)
curl -i -c admin-cookies.txt -X POST $BASE/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}'
curl -b admin-cookies.txt $BASE/admin/urls

# 8. Logout — clears both cookies
curl -i -b cookies.txt -c cookies.txt $BASE/logout
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

- Then log out and log back in so the new access/refresh tokens pick up the new role (refresh tokens last 30 days).

## Project Structure

```
├── index.js                 # App entry: middleware, routers, server boot
├── connection.js            # Mongoose connection helper
├── routes/
│   ├── static.js            # /, /signup, /login, /logout (clears both cookies), /admin/urls
│   ├── user.js              # signup, login, refresh endpoints
│   └── url.js               # shorten, redirect, analytics
├── controllers/
│   ├── user.js              # signup/login/refresh logic (bcrypt, access+refresh cookies)
│   └── url.js               # URL creation, redirect, analytics
├── middlewares/
│   ├── handleAuth.js        # checkAuthentication (soft) + restrictUser (hard gate)
│   └── errorHandler.js      # Global Express error handler
├── models/
│   ├── user.js              # User schema (name, email, hashed password, role)
│   └── url.js               # URL schema (shortId, redirectUrl, visits, owner)
├── utils/
│   └── auth.js              # setAccessToken (15m) / setRefreshToken (30d) / getUser
├── views/                   # EJS templates (home, signup, login)
├── public/                  # Static assets (style.css)
├── .env.example             # Environment variable template
└── .env                     # Your real secrets (gitignored)
```

## License

ISC © Rubayed Ahmed Foysal
