# Punoshristi — Bottle Deposit / RVM System

A local-network system that digitizes a plastic-bottle recycling/deposit machine (a Reverse Vending Machine, or RVM): depositing bottles into the machine generates a **single-use QR code**, and scanning that QR code with a phone instantly credits the user's account with **Eco-Points** and a bottle count — which can later be redeemed at partner shops and cafés.

The system runs two ways:
- **Manual mode** — an operator types the bottle count on a laptop/tablet to generate the QR (handy for testing/demos, no hardware required).
- **Hardware mode (RVM prototype)** — a Raspberry Pi + IR sensor + Start/Stop buttons count bottles automatically, an ad/video carousel plays on the attached monitor while idle, and pressing Stop shows the QR immediately. See [Hardware Prototype (RVM Machine)](#hardware-prototype-rvm-machine) below.

## The six sub-projects

Each one has its own README with full setup/run details — this file covers the big picture, features, and how they fit together.

| Folder | What it is | Port | README |
| --- | --- | --- | --- |
| [`backend/`](backend/) | The central API server — users, sessions/QR, points/leaderboard, partners/redemption, ad uploads & scheduling, JWT auth, Socket.IO real-time events. JSON-file database (`lowdb`). | `4000` | [backend/README.md](backend/README.md) |
| [`web/`](web/) | **The machine's screen (kiosk)** — plays ads while idle; Start/Stop (physical or on-screen) drives bottle counting and QR generation. Works fully without any hardware wired up — a demo/test app in its own right. | `5173` | [web/README.md](web/README.md) |
| [`user-web/`](user-web/) | **The end user's mobile web app** — register with phone OTP verification, dashboard, QR scanning, map of machines, partner offer redemption, leaderboard. Bilingual: English/Bangla, switchable anytime. | `5181` (HTTPS) | [user-web/README.md](user-web/README.md) |
| [`admin/`](admin/) | **Admin dashboard** — manage users/machines/partners/ads, real-time capacity alerts. | `5173` (a separate dev session picks the next free port) | [admin/README.md](admin/README.md) |
| [`kiosk-gpio-bridge/`](kiosk-gpio-bridge/) | **Hardware driver** — runs natively on the Raspberry Pi, reads the Start/Stop buttons and IR bottle sensor via GPIO, and tells `web` about them over a local WebSocket. Falls back to a keyboard simulator on any non-Pi machine. | `5055` (loopback only) | [kiosk-gpio-bridge/README.md](kiosk-gpio-bridge/README.md) |
| `mobile/` | **(currently empty/unused)** — see note below. | — | — |

> **About `mobile/`:** this used to hold an Expo (React Native) app, but it was removed due to local Windows build issues (path-length limits, native toolchain problems). `user-web` replaced it — no app install required, works from any phone browser.

---

## Features

- **Auth + phone verification**: email/phone + password registration/login, 6-digit OTP phone verification (no SMS gateway is wired up yet, so the code is shown on-screen/logged server-side for now — see `backend/README.md`)
- **Eco-Points economy**: 5 points per bottle, 5-tier "Eco Warrior" levels based on lifetime points, an approximate CO2-savings estimate
- **Leaderboard**: weekly / monthly / all-time rankings, with your own rank called out separately
- **Partners & redemption**: browse partner cafés/shops, redeem point-based offers directly (with balance checks)
- **Map**: real machine locations on OpenStreetMap (via `react-leaflet` — no API key needed), distance calculation, favoriting, Google Maps directions links
- **Kiosk hardware**: IR-sensor auto-counting, physical Start/Stop buttons, an idle-screen ad/video carousel that's fully manageable from the admin panel — **per-machine targeting** and **date/day/time scheduling**, like a lightweight Facebook Ads scheduler — with a graceful manual-button fallback when no hardware is present
- **On-device machine setup**: a kiosk can register itself to a machine and set its real GPS location directly from its own screen (⚙ icon), no laptop/admin-panel trip required
- **Admin panel**: manage users/scans/machines/partners/offers/ads; real-time alert when a machine crosses 80% full
- **Bilingual user app**: every screen in `user-web` can be switched between English and Bangla instantly, remembered per device

## Architecture & data flow

```
                     ┌─────────────────────────────┐
   Ad uploads         │                             │   Bottle/points/machine data
  ┌───────────────┐  │                             │  ┌──────────────────────┐
  │  admin panel  │─▶│                             │─▶│  users, sessions,     │
  │  (5173)       │  │                             │  │  machines, scans,     │
  └───────────────┘  │        backend (4000)       │  │  partners,            │
                      │   Express + Socket.IO       │  │  redemptions, ads,    │
  ┌───────────────┐  │   + lowdb (db.json)          │  │  notifications        │
  │ kiosk-gpio-   │  │                             │  └──────────────────────┘
  │ bridge (5055) │  │                             │
  │ (Pi hardware) │  │                             │
  └──────┬────────┘  └───────────────┬─────────────┘
         │ local WebSocket           │ POST /api/sessions
         │ (start/stop/bottle)       │ { session, qrDataUrl }
         ▼                           │
  ┌───────────────┐                  │
  │ web — kiosk   │◀─────────────────┘
  │ screen (5173) │
  │ ads → counting│      POST /api/scan { token }         ┌─────────────────┐
  │ → shows QR    │─── QR scanned ─────────────────────────▶│ user-web (5181) │
  └───────────────┘                                        │ (phone browser) │
                                                             └────────┬────────┘
                                                                      │ socket.io-client
                                          ◀── "bottle-count-updated" / "points-updated" ──┘
                                              (room: user:<userId>)
```

**Step by step (hardware mode):**
1. While idle, `web` (the kiosk screen) plays whatever ads/videos are currently eligible for that machine (`GET /api/ads?machineId=...`).
2. A user presses **Start** (a physical GPIO button, relayed by `kiosk-gpio-bridge` over a local WebSocket, or the on-screen button). The kiosk switches to counting mode.
3. Each bottle passing the IR sensor sends a `bottle` event; the on-screen count goes up live.
4. Pressing **Stop** calls `POST /api/sessions { bottleCount, machineId }` — the backend creates a session with a random `token` (UUID) and returns a QR image (base64 PNG) encoding `{ type: 'bottle-deposit', token }`.
5. In `user-web`, the user scans that QR with their camera, which calls `POST /api/scan { token }` (JWT-protected).
6. The backend validates the token, marks it used, updates the user's `bottleCount` and `points` (5 pts/bottle), logs the scan, and pushes `bottle-count-updated` over Socket.IO to that user's room — their dashboard updates instantly.
7. The kiosk shows the QR for ~30 seconds, then returns to the ad carousel automatically.
8. Scanning the same QR again returns `409 Conflict` — every QR works exactly once.

Manual mode does steps 2–4 with the kiosk's own on-screen buttons — no hardware required at all.

## Quick start

Start these in order (each one's own README has the full detail) — **the backend always goes first**, everything else depends on it:

```bash
# 1. Backend — always first
cd backend && npm install && npm run dev

# 2. Kiosk screen — works standalone, no hardware needed to test
cd web && npm install && npm run dev

# 3. GPIO bridge — only matters once you have a real Raspberry Pi;
#    on any other machine it auto-falls-back to a keyboard simulator
cd kiosk-gpio-bridge && npm install && cp .env.example .env && npm start

# 4. User app (needs your computer's LAN IP to work from a phone — see below)
cd user-web && npm install && npm run dev

# 5. Admin panel
cd admin && npm install && npm run dev
```

## Using the user app on your phone

`user-web` is a normal website — no app-store install — but your phone needs your computer's real network address, not `localhost`:

1. Find your computer's local IP (Windows: `ipconfig`, look for "IPv4 Address"; Mac/Linux: `ifconfig`/`ip addr`) — e.g. `192.168.0.5`.
2. In `user-web/.env`, set:
   ```
   VITE_API_BASE_URL=http://192.168.0.5:4000/api
   VITE_SOCKET_URL=http://192.168.0.5:4000
   ```
   (using your real IP), then restart `npm run dev` — Vite only reads `.env` at startup.
3. Make sure your phone and computer are on the **same Wi-Fi network**.
4. Run `npm run dev` and use the **Network** URL it prints, e.g. `https://192.168.0.5:5181`, on your phone's browser.
5. Accept the self-signed HTTPS certificate warning (tap **Advanced → Proceed**) — this is expected and only needed once; HTTPS is required for the browser to allow camera access for QR scanning.
6. Register, verify your phone number (the OTP code shows on-screen since no SMS gateway is configured yet), and you're in.

Full troubleshooting for this is in [`user-web/README.md`](user-web/README.md).

## Environment variables — quick reference

Every sub-project has its own `.env` (all gitignored) — see each README for the full table. The short version:

| App | Key variables |
| --- | --- |
| `backend` | `PORT`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` |
| `web` (kiosk) | `VITE_API_BASE_URL`, `VITE_GPIO_BRIDGE_URL`, `VITE_MACHINE_ID` |
| `kiosk-gpio-bridge` | `START_BUTTON_PIN`, `STOP_BUTTON_PIN`, `IR_SENSOR_PIN`, `BUZZER_PIN`, `IR_ACTIVE_LOW` |
| `user-web` | `VITE_API_BASE_URL`, `VITE_SOCKET_URL` (both must use your LAN IP for phone access) |
| `admin` | `VITE_API_BASE_URL`, `VITE_SOCKET_URL` |

## Data model & API reference

Full details (every collection, every endpoint) live in [`backend/README.md`](backend/README.md). Summary of the collections in `backend/data/db.json`: `users`, `sessions` (QR tokens), `machines` (with lat/lng), `scans`, `partners` (with offers), `redemptions`, `ads` (with targeting/schedule), `notifications`.

---

## Hardware Prototype (RVM Machine)

Parts list, wiring diagram, GPIO pin table, Raspberry Pi setup, and the full hardware operation flow.

### Wiring diagram

![Circuit diagram](docs/circuit-diagram.svg)

(View the raw file: [`docs/circuit-diagram.svg`](docs/circuit-diagram.svg). Daemon-specific details: [`kiosk-gpio-bridge/README.md`](kiosk-gpio-bridge/README.md).)

### Parts list

| Part | Notes |
| --- | --- |
| Raspberry Pi | Pi 4 (or 3B+), Raspberry Pi OS installed |
| Monitor | Any HDMI monitor — shows the kiosk screen |
| Start button | Momentary pushbutton (normally-open) |
| Stop button | Momentary pushbutton (normally-open) |
| IR sensor | A cheap IR obstacle/proximity module (e.g. FC-51, LM393-based) — mount it across the bottle drop chute |
| Buzzer (optional) | Active buzzer — audio feedback on button presses/bottle counts |
| Pull-down resistors | 2× 10kΩ (for the Start/Stop buttons) |
| Power | 5V/3A USB-C supply for the Pi |

### GPIO pin mapping (BCM numbering)

| Function | BCM GPIO | Header pin | Notes |
| --- | --- | --- | --- |
| Start button | GPIO17 | 11 | One leg to 3V3, other leg to GPIO17 + 10kΩ pull-down to GND |
| Stop button | GPIO27 | 13 | Same pattern, GPIO27 |
| IR sensor OUT | GPIO22 | 15 | Module VCC→5V, GND→GND, OUT→GPIO22 |
| Buzzer + (optional) | GPIO23 | 16 | Buzzer − to GND |

> All of these are configurable in `kiosk-gpio-bridge/.env` — no code changes needed.

### Raspberry Pi setup, step by step

1. **Flash Raspberry Pi OS** (Desktop edition — you need a browser for the kiosk screen) with Raspberry Pi Imager, and set up Wi-Fi on first boot so it joins the same network as the computer running `backend`.
2. **Install Node.js** (v18+):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **Copy/clone this repo** onto the Pi (e.g. to `/home/pi/punoshristi`).
4. **Set up the GPIO bridge:**
   ```bash
   cd server/kiosk-gpio-bridge
   npm install
   cp .env.example .env   # adjust pin numbers if needed
   sudo cp kiosk-gpio-bridge.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now kiosk-gpio-bridge
   systemctl status kiosk-gpio-bridge   # confirm it's running
   ```
5. **Set up the kiosk screen** — in `server/web/.env`, point `VITE_API_BASE_URL` at the backend's LAN IP and set `VITE_MACHINE_ID` for this machine (get its id from the admin panel's Machines page, or register it on-device — see below), then build and serve it statically:
   ```bash
   cd server/web
   npm install
   npm run build
   npm install -g serve
   serve -s dist -l 5173
   ```
6. **Auto-start Chromium in kiosk mode** — add to the Pi desktop's autostart (`~/.config/autostart/kiosk.desktop`):
   ```ini
   [Desktop Entry]
   Type=Application
   Name=Punoshristi Kiosk
   Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required http://localhost:5173
   X-GNOME-Autostart-enabled=true
   ```
   (`--autoplay-policy=no-user-gesture-required` is needed or ad videos may not autoplay.)
7. Reboot the Pi — the GPIO bridge and the kiosk browser both start automatically.

### Setting a machine's location

Either works:
1. **From the admin panel** (remote) — the Machines page has Latitude/Longitude fields when creating/editing a machine.
2. **From the kiosk itself** (on-site) — tap the **⚙** icon on the kiosk screen, log in with the admin password once (used for a single save, never stored), then either tap "Use current GPS location" or type coordinates you looked up on Google Maps. Saving this also locks that kiosk to that machine going forward (see `web/README.md`).

A machine with no location set still shows up on the map at a stable, deterministic fallback position (so nothing breaks) — the API marks these with `hasPreciseLocation: false` so you know which ones still need a real location set.

### Managing kiosk ads (admin panel)

From the admin panel's **Kiosk Ads** page: upload images (jpg/png/webp/gif) or mp4 videos, and optionally target them to specific machines and/or schedule them by date range, day of week, and time of day — like Facebook Ads scheduling. Full rules are in [`backend/README.md`](backend/README.md#ad-targeting--scheduling).

### Testing without hardware

`kiosk-gpio-bridge` automatically runs in **keyboard-simulator mode** on any non-Raspberry-Pi machine — `npm start`, then type `s`/`x`/`b` + Enter in that terminal for Start/Stop/one-bottle. The kiosk screen also always has on-screen manual buttons regardless, so the whole flow is testable with just a mouse.

### Hardware troubleshooting

| Problem | Fix |
| --- | --- |
| Kiosk shows "Manual mode" even on the Pi | Check `systemctl status kiosk-gpio-bridge`; check logs with `journalctl -u kiosk-gpio-bridge -f` |
| Bottles not counting / double-counting | Flip `IR_ACTIVE_LOW` in `.env`; tune `IR_DEBOUNCE_MS` |
| Buttons don't respond | Check the pull-down resistors are wired correctly and the GPIO pin numbers match `.env` |
| GPIO export errors (`EACCES`/`EBUSY`) | Reboot the Pi; check no other bridge process is still holding the pins |
| Ad videos don't autoplay | Confirm `--autoplay-policy=no-user-gesture-required` is in the Chromium launch command |

---

## Troubleshooting (general)

| Problem | Likely cause / fix |
| --- | --- |
| Phone can't reach `user-web` | Confirm same Wi-Fi network; confirm `.env` uses your LAN IP, not `localhost`; confirm you restarted the dev server after editing `.env`; check firewall isn't blocking ports `4000`/`5181` |
| "Connection is not private" warning | Expected — `user-web` uses a self-signed HTTPS cert. Click Advanced → Proceed (once) |
| Camera won't start | Check the site has camera permission; confirm you're on HTTPS (camera access is blocked on plain HTTP) |
| "QR code not recognized" | Make sure only one backend instance is running against the same `db.json` |
| Not receiving the OTP code | No SMS gateway is configured — the code is shown on-screen and logged server-side (see backend README) |
| Ad upload fails | Check file type (jpg/png/webp/gif/mp4) and size (< 100MB) |
| Want to reset all data | Stop the backend and delete `backend/data/db.json` (recreated empty on next start); `npm run seed` to restore demo data |

## Security notes

This is a **local-network / prototype** system. Before any real deployment:

- Replace `JWT_SECRET`, `ADMIN_JWT_SECRET`, `ADMIN_PASSWORD` with long random values
- Restrict the `cors({ origin: '*' })` and Socket.IO CORS configs to your real origin(s)
- Self-signed HTTPS is fine for local testing only — use a real CA-signed certificate for any public deployment
- `kiosk-gpio-bridge` intentionally binds to `127.0.0.1` (loopback) — never expose GPIO control over the network
- Ad uploads are already validated by file type/size (`multer`) — don't remove that
- Phone OTP is currently console-logged only (and echoed in dev responses) — wire up a real SMS gateway (Twilio or a local BD provider) before any real use, and remove the `devCode` field
- `lowdb` + a single JSON file isn't built for concurrent-write-heavy load — migrate to PostgreSQL/MongoDB before scaling
- Passwords are hashed with bcrypt — keep it that way

## Future work

- A real SMS/email gateway for OTP delivery (`nodemailer` is already a dependency but unused)
- Migrate off `lowdb` to a real database
- Expiry/TTL for QR sessions
- An admin-panel "Live Kiosks" view for monitoring multiple Raspberry Pi kiosks at once
- A solenoid/trap-door on the hardware to reject non-PET items
- A production deployment guide (HTTPS reverse proxy, process manager)
