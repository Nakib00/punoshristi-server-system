# Punoshristi — Admin Panel

The management dashboard: users, machines (with GPS location), partners & their offers, kiosk ads (with per-machine targeting and scheduling), and deposit history. Also shows a real-time alert when a machine crosses 80% full.

See the [main README](../README.md) for how this fits into the whole system.

## Stack

React 19 + Vite, `socket.io-client` (for real-time capacity alerts), Material Symbols icons.

## Setup & running

```bash
cd admin
npm install
npm run dev
```

Requires the `backend` to be running first. There's no separate login page — it signs in automatically with the built-in admin credentials on load (see `AdminAuthContext.jsx`); a **Log out** button in the sidebar clears that session if you need to re-authenticate.

Default login: `admin@punoshristi.com` / `admin@1234` — change these via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

## Environment variables (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | The backend |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Real-time capacity alerts |

If you're running this on the same computer as the backend, `localhost` is fine — this app doesn't need to be opened from a phone.

## Pages

- **Overview** — user/machine/scan counts, pending capacity alerts
- **Users** — registered users, bottle counts, scan counts
- **Machines** — create/edit machines including precise Latitude/Longitude, empty a machine's counter, activate/deactivate, delete
- **Partners & Offers** — create partners, add/remove their point-redeemable offers, mark one as "featured"
- **Kiosk Ads** — upload images/videos for the kiosk idle screen, and set per-ad **targeting** (which machines) and **scheduling** (date range, days of week, time of day) — see the backend README for exactly how those rules are evaluated
- **Deposit History** — full scan log across all users/machines
