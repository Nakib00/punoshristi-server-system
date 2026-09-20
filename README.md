# Punoshristi — Bottle Deposit / RVM System

Punoshristi turns a plastic-bottle recycling machine (a "Reverse Vending Machine", or RVM) into a smart, connected system. A person puts empty bottles into the machine, the machine counts them and shows a **QR code**, and scanning that QR code with a phone instantly adds **Eco-Points** to that person's account — points that can later be spent at partner shops and cafés.

This one README explains **everything**: what each part of the project does, exactly how to start all of it on your computer, how to open the app on a phone, and how to set it up on a real Raspberry Pi machine. It's written so that **anyone — even someone who has never run a project like this before — can follow it start to finish.**

Every sub-folder also has its own shorter README with extra detail for that one piece; this file is the map that ties them all together.

---

## 1. What you need before you start

Install these once on the computer that will run the project (this is the "server computer" — usually your laptop or desktop):

| Tool | Why you need it | Where to get it |
| --- | --- | --- |
| **Node.js** (version 18 or newer) | Runs every part of this project | [nodejs.org](https://nodejs.org) — download the "LTS" version and install it like any normal program |
| **A code editor** (optional but helpful) | For opening `.env` files to type in your IP address | [VS Code](https://code.visualstudio.com) is a good free choice |
| **A terminal / command prompt** | For typing the commands below | Windows: "PowerShell" or "Command Prompt" (already on your PC). Mac/Linux: "Terminal" (already there) |

To check Node.js is installed, open a terminal and type:

```bash
node -v
```

If it prints something like `v20.11.0`, you're ready.

You do **not** need a Raspberry Pi, a real RVM machine, or any hardware to try the whole system — everything works on a normal laptop first, with on-screen buttons standing in for the physical ones. Hardware is optional and covered in [Section 7](#7-setting-up-a-real-raspberry-pi-machine-optional).

---

## 2. The six sub-projects (what each one is)

| Folder | What it is | Address once running | Its own README |
| --- | --- | --- | --- |
| [`backend/`](backend/) | The brain — stores all the data (users, points, machines, ads) and answers requests from every other app. **Always start this one first.** | `http://localhost:4000` | [backend/README.md](backend/README.md) |
| [`web/`](web/) | The screen that sits on the physical machine ("the kiosk"). Plays ads, counts bottles, shows the QR code. | `http://localhost:5173` | [web/README.md](web/README.md) |
| [`user-web/`](user-web/) | The app a normal person opens **on their own phone** — sign up, scan the QR, see points, find machines on a map, redeem offers. Works in English or Bangla. | `https://localhost:5181` | [user-web/README.md](user-web/README.md) |
| [`admin/`](admin/) | The staff/owner dashboard — add machines, upload ads, manage partners and users. | `http://localhost:5182` | [admin/README.md](admin/README.md) |
| [`kiosk-gpio-bridge/`](kiosk-gpio-bridge/) | Only needed on a **real Raspberry Pi** — reads the physical Start/Stop buttons and the bottle sensor. On a normal laptop it pretends to be the hardware so you can still test everything with your keyboard. | `http://localhost:5055` | [kiosk-gpio-bridge/README.md](kiosk-gpio-bridge/README.md) |
| `mobile/` | Not used anymore — `user-web` replaced it, since it needs no install at all. | — | — |

---

## 3. The golden rule: what order to start things in

**Always start the backend first.** Everything else talks to it and won't work properly until it's running. After that, order doesn't matter much. A simple, safe order:

1. **Backend** (always first)
2. **web** (the kiosk screen)
3. **kiosk-gpio-bridge** (only matters for real hardware — safe to skip on a laptop)
4. **user-web** (the phone app)
5. **admin** (the dashboard)

Each one runs in its **own terminal window** and keeps running while you use it — don't close that window, just open a new one for the next step.

---

## 4. Running everything on your computer, step by step

Open a terminal, go to the project's `server` folder, and follow each block below **in order**. The first time you run each project you must run `npm install` (this downloads the code's building blocks — it can take a minute or two, and you only need to do it once per project, or again later if it's ever deleted).

### Step 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Leave this window open. You should see it print something like `Server running on port 4000`.

Test it worked by opening `http://localhost:4000/api/health` in a browser — it should show `{"status":"ok"}`.

### Step 2 — Kiosk screen (`web`)

Open a **new** terminal window:

```bash
cd web
npm install
npm run dev
```

Open the address it prints (usually `http://localhost:5173`) in your browser. You'll see the ad screen with on-screen **Start**/**+1 bottle**/**Stop** buttons — this is the exact same screen a real machine would show, just without real hardware attached yet.

### Step 3 — Hardware bridge (`kiosk-gpio-bridge`) — optional on a laptop

Open another new terminal window:

```bash
cd kiosk-gpio-bridge
npm install
copy .env.example .env      # Windows — on Mac/Linux use: cp .env.example .env
npm start
```

On a normal computer (not a Raspberry Pi) this automatically switches to **keyboard simulator mode**. With this window focused, type these letters + Enter to pretend you're pressing the real buttons:
- `s` + Enter → Start
- `b` + Enter → one bottle passes the sensor
- `x` + Enter → Stop (this is when the QR code appears on the `web` screen)

You can skip this step entirely and just click the on-screen buttons in `web` instead — both work identically.

### Step 4 — User app (`user-web`) — the phone app

Open another new terminal window:

```bash
cd user-web
npm install
npm run dev
```

This one needs a small extra setup step before it works from a phone — see **[Section 5](#5-opening-the-user-app-on-your-phone)** below. To just try it on the same computer first, open the `https://` address it prints (e.g. `https://localhost:5181`) — your browser will warn "connection is not private"; that's expected (it's a test certificate), click **Advanced → Proceed**.

### Step 5 — Admin dashboard (`admin`)

Open one more terminal window:

```bash
cd admin
npm install
npm run dev
```

Open the address it prints (usually `http://localhost:5182`). It logs you in automatically — see **[Section 6](#6-logins--default-passwords)** for the admin password.

### All done — checklist

If all five terminal windows are open and running, you now have:

| # | Project | Should be open at |
| - | --- | --- |
| 1 | backend | `http://localhost:4000` |
| 2 | web (kiosk) | `http://localhost:5173` |
| 3 | kiosk-gpio-bridge | `http://localhost:5055` (nothing to look at, just needs to be running) |
| 4 | user-web | `https://localhost:5181` |
| 5 | admin | `http://localhost:5182` |

Try the full flow: click **Start** in `web` → click **+1 bottle** a few times → click **Stop** → a QR code appears. Then open `user-web`, register an account, log in, and scan that QR with your phone (or use the on-screen "enter code manually" option if testing without a camera) — your points should go up instantly.

---

## 5. Opening the user app on your phone

This is the part people get stuck on most, so here it is in full detail. Your phone cannot open `localhost` — that word only means "this same computer." Instead, your phone needs your computer's **network address (IP address)**.

### Step A — Find your computer's IP address

**On Windows:**
1. Open a terminal (PowerShell) and type:
   ```bash
   ipconfig
   ```
2. Look for a line called **"IPv4 Address"** — it looks like `192.168.0.114` (yours will be different numbers).

**On Mac:**
```bash
ifconfig | grep "inet "
```
**On Linux:**
```bash
ip addr
```

Write this number down — this guide will call it **YOUR_IP** below.

### Step B — Tell `user-web` and `admin` to use that IP instead of `localhost`

Open the file `user-web/.env` in a text editor and set:

```
VITE_API_BASE_URL=https://YOUR_IP:4000/api
VITE_SOCKET_URL=https://YOUR_IP:4000
```

(Replace `YOUR_IP` with the real number from Step A, e.g. `192.168.0.114`.)

> **Important:** after changing a `.env` file, you must **stop and restart** that project's `npm run dev` (press `Ctrl+C` in its terminal, then run `npm run dev` again) — these settings are only read once, when it starts.

### Step C — Connect your phone to the same Wi-Fi

Your phone and your computer **must be on the same Wi-Fi network** (not mobile data, not a different Wi-Fi). This is the single most common reason it doesn't work.

### Step D — Open it on your phone

1. Look at the terminal window running `user-web` — alongside the `localhost` line, Vite also prints a **Network** address, e.g. `https://192.168.0.114:5181`.
2. Type that exact address into your phone's browser (Chrome recommended).
3. You'll see the same "connection is not private" warning as before — tap **Advanced → Proceed** (this is a self-signed test certificate; it's expected and safe on your own local network). You only need to do this once.
4. The Punoshristi splash screen should appear. Register an account, verify with the on-screen OTP code (see note below), and you're in.

### If it still doesn't work

| Problem | Fix |
| --- | --- |
| Phone shows nothing / times out | Double-check phone and computer are on the exact same Wi-Fi network |
| Phone loads a blank/old page | You edited `.env` but forgot to restart `npm run dev` |
| "Can't reach this page" | Your computer's Windows Firewall may be blocking the connection — allow Node.js through the firewall when prompted, or temporarily disable the firewall for testing |
| IP address keeps changing | Some home routers reassign IPs — just re-run `ipconfig`/`ifconfig` and update `.env` again if it changed |
| Camera won't scan the QR | Camera access requires the padlock/HTTPS address (`https://...:5181`, not `http://`) — make sure you didn't accidentally use the HTTP link |

---

## 6. Logins & default passwords

| App | Login | Value |
| --- | --- | --- |
| **Admin panel** (`admin`) | Email | `admin@punoshristi.com` |
| | Password | `admin@1234` |
| **User app** (`user-web`) | — | Anyone can register their own account from the app itself — no default account |
| **Kiosk on-device setup** (`web`, the ⚙ gear icon) | Password | Same as the admin password above |

**To change the admin password:** open `backend/.env` and edit the `ADMIN_EMAIL` / `ADMIN_PASSWORD` lines, then restart the backend. Do this before using the system for anything beyond local testing.

---

## 7. Setting up a real Raspberry Pi machine (optional)

This section is only needed once you have an actual Raspberry Pi + buttons + sensor wired up. For a plain laptop demo, skip this — [Section 4](#4-running-everything-on-your-computer-step-by-step) already covers everything.

### 7.1 What runs where

- **Your main computer** (anywhere on the same Wi-Fi) runs: `backend`, `admin`, and `user-web`. This is your "server computer" — keep it turned on and connected the whole time the machine is in use.
- **The Raspberry Pi** (bolted inside/near the physical machine) runs: `web` (the kiosk screen) and `kiosk-gpio-bridge` (reads the real buttons/sensor). It talks to your main computer's `backend` over Wi-Fi.

You can have **more than one Raspberry Pi machine** — each one just needs its own `machineId` (see Section 7.4) so the admin panel and map can tell them apart.

### 7.2 Parts list

| Part | Notes |
| --- | --- |
| Raspberry Pi | Pi 4 or 3B+, with Raspberry Pi OS (Desktop edition) installed |
| Monitor | Any HDMI monitor — shows the kiosk ad/QR screen |
| Start button | Momentary pushbutton |
| Stop button | Momentary pushbutton |
| IR sensor | A cheap IR obstacle sensor module, mounted across the bottle chute |
| Buzzer (optional) | For a beep on button press / bottle count |
| 2× 10kΩ resistors | Pull-downs for the Start/Stop buttons |
| 5V/3A power supply | For the Pi |

### 7.3 Wiring (BCM pin numbers)

| Function | BCM GPIO | Header pin | Notes |
| --- | --- | --- | --- |
| Start button | GPIO17 | 11 | One leg to 3V3, other leg to GPIO17 + 10kΩ pull-down to GND |
| Stop button | GPIO27 | 13 | Same pattern, GPIO27 |
| IR sensor OUT | GPIO22 | 15 | Sensor VCC→5V, GND→GND, OUT→GPIO22 |
| Buzzer + (optional) | GPIO23 | 16 | Buzzer − to GND |

Full wiring diagram: [`docs/circuit-diagram.svg`](docs/circuit-diagram.svg). All pin numbers can be changed in `.env` with no code changes.

### 7.4 Step-by-step Pi setup

1. **Flash Raspberry Pi OS (Desktop edition)** with the free [Raspberry Pi Imager](https://www.raspberrypi.com/software/) tool, and set up Wi-Fi during that process so it's on the **same network** as your main computer.
2. **Install Node.js on the Pi:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **Copy this whole project onto the Pi**, e.g. into `/home/pi/punoshristi`.
4. **Find your main computer's IP address** (same as Section 5, Step A) — the Pi needs this to reach the backend.
5. **Set up the GPIO bridge:**
   ```bash
   cd punoshristi/server/kiosk-gpio-bridge
   npm install
   cp .env.example .env
   sudo cp kiosk-gpio-bridge.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now kiosk-gpio-bridge
   systemctl status kiosk-gpio-bridge      # should say "active (running)"
   ```
6. **Set up the kiosk screen** — edit `server/web/.env` and point it at your main computer:
   ```
   VITE_API_BASE_URL=http://YOUR_MAIN_COMPUTER_IP:4000/api
   ```
   Then build it and serve the finished files:
   ```bash
   cd punoshristi/server/web
   npm install
   npm run build
   sudo npm install -g serve
   serve -s dist -l 5173
   ```
7. **Make the kiosk screen open automatically on boot, full-screen** — create `~/.config/autostart/kiosk.desktop` on the Pi with:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=Punoshristi Kiosk
   Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required http://localhost:5173
   X-GNOME-Autostart-enabled=true
   ```
8. **Reboot the Pi.** The button/sensor reader and the full-screen kiosk browser should both start on their own from now on.

### 7.5 Setting each machine's location (so it shows correctly on the map)

Every physical machine needs its own real-world location. Either way works — do whichever is easier at the time:

- **From the admin panel** (from anywhere) — the Machines page has Latitude/Longitude fields.
- **From the machine itself** (standing next to it) — tap the small **⚙** gear icon on the kiosk screen, enter the admin password once, then tap **"Use current GPS location"** (or type coordinates from Google Maps). This also locks that screen to that specific machine going forward.

### 7.6 Managing ads (admin panel)

Open the admin panel's **Kiosk Ads** page to upload images or videos for the idle screen. Each ad can optionally be limited to:
- **specific machines** (so different locations show different ads),
- **a date range** (e.g. only during a promotion week),
- **specific days of the week**,
- **a time-of-day window** (e.g. only 9am–6pm).

This works like Facebook Ads scheduling — the backend checks all of these rules automatically every time a kiosk asks "what ad should I show right now?"

### 7.7 Testing the hardware flow without owning a Pi

`kiosk-gpio-bridge` automatically drops into **keyboard-simulator mode** on any computer that isn't a real Raspberry Pi (see [Step 3 in Section 4](#step-3--hardware-bridge-kiosk-gpio-bridge--optional-on-a-laptop)) — so the entire Start → count → Stop → QR flow can be tested with just a keyboard, no soldering required.

### 7.8 Hardware troubleshooting

| Problem | Fix |
| --- | --- |
| Kiosk shows "Manual mode" even on the real Pi | Run `systemctl status kiosk-gpio-bridge` and `journalctl -u kiosk-gpio-bridge -f` to see why it's not running |
| Bottles not counting, or counting twice per bottle | Flip `IR_ACTIVE_LOW` in `.env`; adjust `IR_DEBOUNCE_MS` |
| Buttons don't respond | Check the pull-down resistor wiring and that pin numbers in `.env` match your actual wiring |
| GPIO errors (`EACCES` / `EBUSY`) | Reboot the Pi — another process may still be holding the pins |
| Ad videos don't autoplay | Confirm `--autoplay-policy=no-user-gesture-required` is in the Chromium launch command |

---

## 8. Features

- **Accounts & phone verification** — register/login with email + password, then verify your phone with a 6-digit code (no SMS provider is connected yet, so the code is shown on-screen for testing — see `backend/README.md`)
- **Eco-Points** — 5 points per bottle, 5 "Eco Warrior" levels based on lifetime points, an estimated CO2-savings number
- **Leaderboard** — weekly / monthly / all-time rankings, with your own rank highlighted
- **Partners & redemption** — browse partner cafés/shops and redeem point-based offers
- **Map** — real machine locations (OpenStreetMap, no API key needed), distance sorting, favorites, directions
- **Kiosk hardware** — automatic IR bottle counting, physical Start/Stop buttons, an idle-screen ad carousel fully controlled from the admin panel (per-machine targeting + date/day/time scheduling), with a manual on-screen fallback when there's no hardware
- **On-device machine setup** — a kiosk can register itself and set its GPS location right from its own screen
- **Admin dashboard** — manage users, scans, machines, partners, offers, and ads; real-time alert when a machine crosses 80% full
- **Bilingual user app** — every screen switches instantly between English and Bangla, remembered per device

## 9. How the pieces talk to each other

```
                     ┌─────────────────────────────┐
   Ad uploads         │                             │   Bottle/points/machine data
  ┌───────────────┐  │                             │  ┌──────────────────────┐
  │  admin panel  │─▶│                             │─▶│  users, sessions,     │
  │  (5182)       │  │                             │  │  machines, scans,     │
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

**Step by step:**
1. While idle, `web` (the kiosk screen) plays whatever ads are currently eligible for that machine.
2. Someone presses **Start** (real button or on-screen). The kiosk switches to counting mode.
3. Each bottle passing the sensor (or each "+1 bottle" click) increases the count live.
4. Pressing **Stop** asks the backend to create a session; the backend returns a one-time QR code.
5. In `user-web`, the user scans that QR with their phone camera.
6. The backend checks the code, adds points + bottle count to that user, and instantly updates their dashboard over a live connection (Socket.IO).
7. The kiosk shows the QR for about 30 seconds, then goes back to playing ads.
8. Scanning the same QR twice is blocked — every code works exactly once.

## 10. Environment variables — quick reference

Every sub-project has its own `.env` file (not tracked by git) — see each one's own README for the full list. Short version:

| App | Key variables |
| --- | --- |
| `backend` | `PORT`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| `web` (kiosk) | `VITE_API_BASE_URL`, `VITE_GPIO_BRIDGE_URL`, `VITE_MACHINE_ID` |
| `kiosk-gpio-bridge` | `START_BUTTON_PIN`, `STOP_BUTTON_PIN`, `IR_SENSOR_PIN`, `BUZZER_PIN`, `IR_ACTIVE_LOW` |
| `user-web` | `VITE_API_BASE_URL`, `VITE_SOCKET_URL` (both must use your computer's real IP address for phone access — see [Section 5](#5-opening-the-user-app-on-your-phone)) |
| `admin` | `VITE_API_BASE_URL`, `VITE_SOCKET_URL` |

## 11. Data model & API reference

Full details (every data collection, every API endpoint) live in [`backend/README.md`](backend/README.md). Quick summary of what's stored in `backend/data/db.json`: `users`, `sessions` (QR codes), `machines` (with location), `scans`, `partners` (with offers), `redemptions`, `ads` (with targeting/schedule), `notifications`.

## 12. General troubleshooting

| Problem | Likely cause / fix |
| --- | --- |
| Nothing loads at all | Make sure the **backend** is running first — check `http://localhost:4000/api/health` |
| Phone can't reach `user-web` | See the full checklist in [Section 5](#5-opening-the-user-app-on-your-phone) |
| "Connection is not private" warning | Expected — `user-web` uses a self-signed test certificate. Click **Advanced → Proceed** (once) |
| Camera won't start | Confirm camera permission is allowed for the site, and that you're using the `https://` address, not `http://` |
| "QR code not recognized" | Make sure only one copy of the backend is running against the same `db.json` |
| Not receiving an OTP text message | No SMS provider is connected yet — the code is shown on-screen and logged by the backend (see `backend/README.md`) |
| Ad upload fails | Check the file type (jpg/png/webp/gif/mp4) and size (under 100MB) |
| Want to wipe all data and start fresh | Stop the backend, delete `backend/data/db.json` (it's recreated empty next start), then optionally run `npm run seed` to load demo data back in |

## 13. Security notes

This is a **local-network prototype**. Before using it for anything beyond testing/demos:

- Replace `JWT_SECRET`, `ADMIN_JWT_SECRET`, and `ADMIN_PASSWORD` with your own long random values
- Restrict the CORS settings (`origin: '*'`) to your real domain(s) instead of allowing everything
- The self-signed HTTPS certificate is fine for local testing only — use a real certificate for any public deployment
- `kiosk-gpio-bridge` intentionally only listens on `127.0.0.1` (this same device) — never expose GPIO control to the network
- Keep the existing file-type/size checks on ad uploads
- Connect a real SMS provider before real use, and remove the on-screen "dev code" once you do
- Move off the JSON-file database (`lowdb`) to a real database (PostgreSQL/MongoDB) before handling serious load
- Passwords are already hashed with bcrypt — keep it that way

## 14. Possible future improvements

- A real SMS/email provider for OTP delivery (`nodemailer` is already installed but unused)
- Moving from `lowdb` to a proper database
- An expiry time on unused QR codes
- A "Live Kiosks" view in the admin panel to monitor multiple Raspberry Pi machines at once
- A solenoid/trap-door on the hardware to reject non-bottle items
- A full production deployment guide (HTTPS reverse proxy, process manager)
