# Punoshristi — User App (`user-web`)

The mobile web app end users open on their own phone: register, verify their phone number, scan the machine's QR code, track points/level, find machines on a map, redeem partner offers, and check the leaderboard. No app-store install — it's a normal website that works great added to the home screen.

See the [main README](../README.md) for how this fits into the whole system.

## Stack

React 19 + Vite + Tailwind CSS, `react-router-dom` v7, `react-leaflet` + Leaflet (OpenStreetMap tiles — no API key needed), `html5-qrcode`, `socket.io-client`.

## Setup & running

```bash
cd user-web
npm install
npm run dev
```

This runs over **HTTPS** by default (self-signed certificate) — required by browsers before they'll allow camera access for QR scanning. The first time you open it you'll see a "connection is not private" warning; that's expected for a self-signed cert, click through it (Advanced → Proceed).

Requires the `backend` to be running first.

## Opening it on your phone (local network)

The dev server needs to be reachable from your phone, which means `localhost` won't work — you need your computer's actual network address.

1. **Find your computer's local IP address.**
   - Windows: open a terminal and run `ipconfig`, look for "IPv4 Address" (e.g. `192.168.0.5`).
   - Mac/Linux: run `ifconfig` or `ip addr`, look for your Wi-Fi adapter's `inet` address.
2. **Point this app at your backend using that IP** — edit `user-web/.env`:
   ```
   VITE_API_BASE_URL=http://192.168.0.5:4000/api
   VITE_SOCKET_URL=http://192.168.0.5:4000
   ```
   (swap in your actual IP). Restart `npm run dev` after editing `.env` — Vite inlines these values at build/start time, so it won't pick up changes on its own.
3. **Make sure your phone and computer are on the same Wi-Fi network.**
4. **Start the dev server** (`npm run dev`) and look at the terminal output — it prints a **Network** URL, e.g. `https://192.168.0.5:5181`.
5. **Open that Network URL in your phone's browser** (Chrome works well). You'll get the same self-signed-certificate warning as on desktop — tap **Advanced → Proceed** (only needed once).
6. Register an account, verify your phone number (see the OTP note below), and you're in.

If your phone can't reach the page at all: double-check both devices are on the same network, that step 2's IP is current (it can change if your router reassigns it), and that your computer's firewall isn't blocking ports `4000` (backend) or `5181` (this app).

## Bilingual UI (English / বাংলা)

Every screen has a language switch (top-right, usually near the notification bell, or in the header on screens without a top bar). It's a simple client-side dictionary (`src/i18n/translations.js`) — the whole UI re-renders in the chosen language instantly, and the choice is remembered per-device via `localStorage`. To add another language, add a new key (e.g. `hi: '...'`) next to each `en`/`bn` pair in that file.

## OTP phone verification

There's no SMS gateway wired up yet (see the backend README), so during registration the verification code is shown directly on the OTP screen ("Dev mode: your code is ...") instead of arriving by text message. This is clearly a placeholder for a real SMS provider — everything else about the verification flow (expiry, attempt limits, resend cooldown) is fully real.

## Environment variables (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Must be your computer's LAN IP (not `localhost`) to work from a phone |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Same reasoning — real-time point updates |

`PUNOSHRISTI_NO_HTTPS=1 npm run dev` runs the dev server over plain HTTP instead (camera scanning won't work, but it's useful for quickly checking layout in a browser that dislikes self-signed certs).

## Pages

Splash → Onboarding (first run only) → Login/Register → Phone OTP → Dashboard → Scan → Success → Map → Partners → Partner Detail → Leaderboard → Profile → History → Info (Settings/Privacy/Help/Contact/Rate placeholders).
