# Punoshristi — Kiosk GPIO Bridge

A small Node daemon that runs **natively on the Raspberry Pi** (never in a browser — a web page has no access to GPIO pins). It reads the machine's physical Start/Stop buttons and IR bottle sensor, and pushes those events over a local, loopback-only WebSocket to the kiosk screen (`../web`).

See the [main README's hardware section](../README.md#hardware-prototype-rvm-machine) for the full parts list, wiring diagram, and Raspberry Pi setup steps — this file covers just this daemon.

## Setup & running

```bash
cd kiosk-gpio-bridge
npm install
cp .env.example .env   # adjust pin numbers if needed
npm start
```

**On a Raspberry Pi**, this reads real GPIO pins via [`onoff`](https://www.npmjs.com/package/onoff).

**On anything else** (Windows/Mac dev laptop) — `onoff` can't work there (no `/sys/class/gpio`), so this automatically falls back to a **keyboard simulator**: with the process running, type in that terminal:
- `s` + Enter → simulates the Start button
- `x` + Enter → simulates the Stop button
- `b` + Enter → simulates one bottle passing the IR sensor

This means the entire hardware flow — Start → count → Stop → QR — is testable end-to-end without owning a Pi. Check `GET http://localhost:5055/health` to see which mode it's running in (`{"mode": "gpio"}` or `{"mode": "simulated"}`).

## Wiring (BCM pin numbers)

| Function | BCM GPIO | Header pin | Notes |
| --- | --- | --- | --- |
| Start button | GPIO17 | 11 | One leg to 3V3, other leg to GPIO17 + a 10kΩ pull-down to GND |
| Stop button | GPIO27 | 13 | Same pattern, GPIO27 |
| IR sensor OUT | GPIO22 | 15 | Sensor VCC→5V, GND→GND, OUT→GPIO22 |
| Buzzer + (optional) | GPIO23 | 16 | Buzzer − to GND |

Full wiring diagram: [`../docs/circuit-diagram.svg`](../docs/circuit-diagram.svg).

## Environment variables (`.env`)

All documented with inline comments in `.env.example`: `PORT` (default `5055`), `START_BUTTON_PIN`, `STOP_BUTTON_PIN`, `IR_SENSOR_PIN`, `BUZZER_PIN`, `IR_ACTIVE_LOW` (flip this if bottles aren't counting or are double-counting), `IR_DEBOUNCE_MS`, `BUTTON_DEBOUNCE_MS`.

## Running on boot (systemd)

```bash
sudo cp kiosk-gpio-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kiosk-gpio-bridge
sudo systemctl status kiosk-gpio-bridge   # confirm it's running
journalctl -u kiosk-gpio-bridge -f        # live logs
```

## Security note

This server intentionally binds to `127.0.0.1` only (loopback) — it should never be reachable over the network. It has no authentication of its own because it's not meant to be reachable by anything except the kiosk browser tab running on that same physical device.
