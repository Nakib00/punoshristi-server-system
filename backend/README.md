# Punoshristi — Backend

The central API server. Every other app in this repo (the kiosk screen, the user's phone app, the admin panel, and the Raspberry Pi's GPIO bridge indirectly) talks to this one server. It owns the database, generates QR codes, tracks points/levels, runs the ad-scheduling logic, and pushes real-time updates over Socket.IO.

See the [main README](../README.md) for how this fits into the whole system.

## Stack

Node.js + Express 4, [lowdb](https://github.com/typicode/lowdb) (a JSON-file database — no separate database server to install), Socket.IO, JWT auth, bcrypt, `qrcode`, `multer` (file uploads).

## Setup & running

```bash
cd backend
npm install
npm run dev        # nodemon, auto-restarts on file changes
# or: npm start     # plain node, for production-style running
```

Listens on `0.0.0.0:4000` by default, so it's reachable from any device on the same network (phones, the Pi, other laptops) — not just `localhost`.

Seed some demo machines and partners on a fresh install:
```bash
npm run seed
```

Verify it's running: `curl http://localhost:4000/api/health` → `{"status":"ok"}`.

## Environment variables (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Port the API listens on |
| `JWT_SECRET` | `dev-secret` | Signs user auth tokens — **change this before any real deployment** |
| `ADMIN_JWT_SECRET` | (code default) | Signs admin tokens |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@punoshristi.com` / `admin@1234` | Admin panel login |
| `NODE_ENV` | (unset) | When not `production`, the OTP endpoint also returns `devCode` in its response (see below) |

## Data model (`data/db.json`)

A single JSON file (gitignored, auto-created on first run) with these collections:

- **`users`** — `id, name, email, phone, passwordHash, bottleCount, points, phoneVerified, favorites[], otp, createdAt`
- **`sessions`** — one per generated QR code: `id, token, bottleCount, machineId, machineName, machineLocation, used, redeemedBy, redeemedAt, createdAt`
- **`machines`** — `id, name, location, address, capacity, currentBottles, active, lat, lng, createdAt` (a machine without `lat`/`lng` gets a stable, deterministic fallback position computed on the fly — see `src/lib/geo.js` — so the map never breaks, but you should set real coordinates via the admin panel or the kiosk's own ⚙ setup screen)
- **`scans`** — redeemed-QR history: `id, userId, machineId, sessionId, bottleCount, pointsEarned, createdAt`
- **`partners`** — `id, name, category, address, hours, rating, distanceKm, featured, offers: [{id, title, pointsCost, icon}]`
- **`redemptions`** — `id, userId, partnerId, offerId, pointsCost, createdAt`
- **`ads`** — kiosk carousel content: `id, title, type ('image'|'video'), filename, durationSeconds, order, active, machineIds[], startDate, endDate, daysOfWeek[], startTime, endTime, createdAt`
- **`notifications`** — machine-capacity alerts for the admin panel

> A single JSON file is fine for a prototype but isn't built for concurrent-write-heavy production load — migrate to PostgreSQL/MongoDB before scaling this up.

## Points economy

- **5 points per bottle** deposited (see `src/lib/points.js`)
- **Eco Warrior levels** are derived from *lifetime* points earned (never decreases even after spending) — 5 levels, thresholds in `LEVEL_THRESHOLDS`
- **CO2 estimate** is a rough, commonly-cited approximation (~0.1kg CO2 avoided per bottle), shown as "approximate" in the UI — not a precise measurement

## API reference

Base URL: `http://<host>:4000/api`. Protected routes need `Authorization: Bearer <token>`.

| Group | Method & Path | Auth | Notes |
| --- | --- | --- | --- |
| Health | `GET /health` | — | `{ status: 'ok' }` |
| Auth | `POST /auth/register` | — | `{ name, email, password, phone }` → `201 { token, user }` |
| Auth | `POST /auth/login` | — | `{ emailOrPhone, password }` → `200 { token, user }` |
| Auth | `GET /auth/me` | ✅ | Current user |
| Auth | `POST /auth/otp/send` | ✅ | Issues a 6-digit phone-verification code. No SMS gateway is wired up (see note below) — the code is logged server-side and, outside `NODE_ENV=production`, also returned as `devCode` in the response |
| Auth | `POST /auth/otp/verify` | ✅ | `{ code }` → on success, `phoneVerified: true` |
| Sessions | `POST /sessions` | — | `{ bottleCount, machineId }` → `{ session, qrDataUrl }` (called by the kiosk) |
| Sessions | `GET /sessions/:id` | — | Session lookup |
| Scan | `POST /scan` | ✅ | `{ token }` → redeems the QR, awards points/bottles, pushes a Socket.IO update |
| Machines | `GET /machines` | — | Active machines, with `lat`/`lng`, `fillPercent`, `status` |
| Machines | `POST /machines`, `PUT/DELETE /machines/:id` | ✅ admin | Machine CRUD |
| Partners | `GET /partners`, `GET /partners/:id` | — | Partner + offer listings |
| Partners | `POST /partners/:id/redeem` | ✅ | `{ offerId }` → deducts points, records the redemption |
| Partners | admin CRUD routes | ✅ admin | Create/update/delete partners and offers |
| Leaderboard | `GET /leaderboard?range=week\|month\|all` | — | Top 50 |
| Leaderboard | `GET /leaderboard/me?range=...` | ✅ | Your own rank |
| My | `GET /my/stats`, `GET /my/activity`, `GET /my/scans` | ✅ | Dashboard/profile/history data |
| My | `POST /my/favorites/:machineId` | ✅ | Toggles a favorited machine |
| Ads | `GET /ads?machineId=<id>` | — | The kiosk's *currently eligible* ad playlist for that machine (already filtered by targeting + schedule, see below) |
| Ads | `POST /ads` (multipart) | ✅ admin | Upload an image/video, with optional targeting/schedule fields |
| Ads | `PUT/DELETE /ads/:id` | ✅ admin | Update or delete an ad (targeting/schedule can be edited via `PUT` with a plain JSON body) |
| Admin | `/admin/*` | ✅ admin | Stats, users, scan history, notifications |

### Ad targeting & scheduling

Each ad can optionally be restricted to specific machines (`machineIds`), a date range (`startDate`/`endDate`), specific days of the week (`daysOfWeek`, 0=Sun..6=Sat), and a daily time window (`startTime`/`endTime`, `HH:mm`). All set conditions must currently be true for the ad to appear — see `src/lib/adSchedule.js`. This logic runs against the **server's local clock**, so make sure the machine running this backend has its timezone/clock set correctly.

## Real-time events (Socket.IO)

- Connect with `io(SOCKET_URL, { auth: { token } })` using either a user or an admin JWT.
- Rooms: `user:<userId>` or `admin`.
- **`bottle-count-updated`** (to the user's room, after a successful scan): `{ addedBottles, bottleCount, earnedPoints, points, redeemedAt, machineName, machineLocation }`
- **`points-updated`** (to the user's room, after redeeming a partner offer): `{ points, reason: 'redemption', redemption }`
- **`machine-capacity-alert`** (to the `admin` room, when a machine crosses 80% full)

## Security notes

This is built for local-network / prototype use. Before any real deployment:

- Replace `JWT_SECRET`, `ADMIN_JWT_SECRET`, `ADMIN_PASSWORD` with long random values
- Restrict `cors({ origin: '*' })` and the Socket.IO CORS config to your real origin(s)
- Wire up a real SMS gateway (Twilio, or a local BD provider) for OTP delivery and remove the `devCode` field from the response
- File uploads are already validated by type and size (`multer` `fileFilter` + `limits`) — don't remove that
- Migrate off the single-JSON-file database before any real concurrent load
