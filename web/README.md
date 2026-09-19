# Punoshristi — Kiosk Screen (`web`)

This is what runs on the monitor attached to the physical bottle-deposit machine (or on a laptop, for demoing without any hardware). It plays an ad/video carousel while idle, counts bottles when Start is pressed, and shows a QR code when Stop is pressed. It's a **demo/test-friendly app** — the entire flow works with on-screen buttons even with zero hardware wired up, which is exactly what makes it easy to develop and show without a Raspberry Pi.

See the [main README](../README.md) for how this fits into the whole system, and [`../kiosk-gpio-bridge/README.md`](../kiosk-gpio-bridge/README.md) for the physical hardware side.

## Stack

React 19 + Vite, `qrcode.react`, `socket.io-client` (for talking to the local GPIO bridge).

## Setup & running

```bash
cd web
npm install
npm run dev
```

Opens at the URL Vite prints (default `http://localhost:5173`). Requires the `backend` to be running (see its README) — set `VITE_API_BASE_URL` in `.env` to point at it if it's not on `localhost`.

## How it works

A simple state machine: **idle** (ads looping) → **counting** (live bottle count) → **generating** (creating the QR) → **qr** (showing it) → back to **idle**.

- **Start / Stop**: triggered either by physical GPIO buttons (via `kiosk-gpio-bridge`, over a local WebSocket) or the on-screen buttons — both work identically from the app's point of view.
- **Bottle counting**: incremented by IR-sensor pulses from the bridge, or manually via the on-screen **+1** button.
- **QR generation**: on Stop, this app calls the backend's `POST /api/sessions`, which does the real work (creates a session, renders the QR) and returns it — this app just displays what it gets back.
- **Ads**: fetched from `GET /api/ads?machineId=<this machine's id>`, which the backend already filters by targeting and schedule (see the backend README). Re-fetched automatically every 3 minutes while idle so a schedule change takes effect without a manual reload.
- **⚙ Machine setup**: tap the small gear icon (top-right, only visible while idle) to register this kiosk to a specific machine and set its real GPS location — either by using the browser's geolocation or by typing coordinates found on Google Maps. This asks for the admin password once (used for a single API call, never stored) and then remembers the machine via `localStorage` on this device, so it doesn't need to be redone unless you tap "disconnect".

## Locking a kiosk to one machine

There are two ways — either is fine:
1. **Build-time**: set `VITE_MACHINE_ID` in `.env` before building/running.
2. **On-device**: use the ⚙ setup screen described above — no rebuild needed, good for an installer standing at the actual machine.

If neither is set, the screen shows a dropdown to pick a machine manually (handy for testing on a laptop with several demo machines).

## Environment variables (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | The backend |
| `VITE_GPIO_BRIDGE_URL` | `http://localhost:5055` | The local GPIO bridge daemon — always on the same device as this app, never over the network |
| `VITE_MACHINE_ID` | (unset) | See "Locking a kiosk to one machine" above |

## Testing without any hardware

`kiosk-gpio-bridge` automatically falls back to a keyboard simulator when it's not running on a Raspberry Pi (see its README) — so you can test the full Start → count → Stop → QR flow driven by real "hardware" events even on a laptop. Or just ignore the bridge entirely and use the on-screen **+1** / **Stop** buttons; the status badge will show "Manual mode" and everything still works.

## Deploying to a real kiosk (Raspberry Pi)

Build a production bundle and serve it statically, then open it in Chromium's kiosk mode:

```bash
npm run build
npx serve -s dist -l 5173
```

Full step-by-step Pi setup (autostart, systemd, wiring) is in the [main README's hardware section](../README.md#hardware-prototype-rvm-machine).
