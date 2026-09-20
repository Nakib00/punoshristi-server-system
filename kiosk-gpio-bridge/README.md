# Punoshristi — Kiosk GPIO Bridge

A small Node daemon that runs **natively on the kiosk device** (never in a browser — a web page has no access to GPIO pins or serial ports). It reads the machine's physical Start/Stop buttons and IR bottle sensor, and pushes those events over a local, loopback-only WebSocket to the kiosk screen (`../web`).

Three interchangeable hardware backends are supported. The kiosk web app can't tell which one is active — all three just emit the same `start` / `stop` / `bottle` events:

| Mode | When it's used | Runs on |
| --- | --- | --- |
| **Raspberry Pi GPIO** | The real RVM machine | Raspberry Pi |
| **Arduino (USB serial)** | Testing without a Pi — an Arduino stands in for the sensor/buttons | Any laptop/PC (Windows/Mac/Linux) |
| **Keyboard simulator** | Automatic fallback when neither of the above is available | Any laptop/PC |

See the [main README's hardware section](../README.md#hardware-prototype-rvm-machine) for the full parts list and Raspberry Pi setup steps — this file covers just this daemon.

## Setup & running

```bash
cd kiosk-gpio-bridge
npm install
cp .env.example .env   # set ARDUINO_PORT for Arduino mode, or adjust GPIO pins
npm start
```

Check `GET http://localhost:5055/health` any time to see which mode it's actually running in: `{"mode": "gpio"}`, `{"mode": "arduino"}`, or `{"mode": "simulated"}`.

### Keyboard simulator (no hardware at all)

The automatic fallback when neither a Pi's GPIO nor an `ARDUINO_PORT` device is available. With the process running, type in that terminal:
- `s` + Enter → simulates the Start button
- `x` + Enter → simulates the Stop button
- `b` + Enter → simulates one bottle passing the IR sensor

This means the entire hardware flow — Start → count → Stop → QR — is testable end-to-end with zero hardware.

## Arduino mode (laptop testing setup)

Use this when you want real button/sensor hardware but don't have a Raspberry Pi yet — an Arduino Uno/Nano plugged into a laptop over USB stands in for the Pi.

1. **Wire the Arduino** — see [`../docs/circuit-diagram-arduino.svg`](../docs/circuit-diagram-arduino.svg) and the pin table below.
2. **Flash the sketch** — open [`arduino/punoshristi_kiosk_bridge.ino`](arduino/punoshristi_kiosk_bridge.ino) in the Arduino IDE, select your board/port, and upload it. It just reads the buttons/sensor and prints `START` / `STOP` / `BOTTLE` lines over serial — no libraries required.
3. **Find the serial port** the Arduino enumerated as:
   - Windows: Device Manager → Ports (COM & LPT), e.g. `COM3`
   - Mac: `ls /dev/cu.*`, e.g. `/dev/cu.usbmodem14101`
   - Linux: `ls /dev/tty*`, e.g. `/dev/ttyACM0`
4. **Set it in `.env`**: `ARDUINO_PORT=COM3` (swap in your actual port), then `npm start`.
5. Confirm with `GET http://localhost:5055/health` → `{"mode": "arduino"}`. If the port couldn't be opened (wrong port name, Arduino unplugged, IDE's Serial Monitor still holding the port open), this automatically falls back to the keyboard simulator instead of crashing — check the terminal log for why.

### Arduino wiring (digital pin numbers)

| Function | Arduino pin | Notes |
| --- | --- | --- |
| Start button | D2 | Other leg → GND. Uses D2's internal pull-up — no resistor needed |
| Stop button | D3 | Same pattern, D3 |
| IR sensor OUT | D4 | Sensor VCC→5V, GND→GND, OUT→D4 |
| Buzzer + (optional) | D8 | Buzzer − to GND |

Full wiring diagram: [`../docs/circuit-diagram-arduino.svg`](../docs/circuit-diagram-arduino.svg).

### Running this laptop setup over Wi-Fi with the backend on another PC

This is the point of the Arduino mode — the whole rig (this bridge + the `web` kiosk screen + the Arduino) runs on one laptop, while `backend` (and usually `admin`) run on a separate PC, both on the same Wi-Fi network:

1. On the **backend PC**, start `backend` (and `admin` if you want the dashboard there) as usual, and find that PC's LAN IP (`ipconfig` / `ifconfig`).
2. On the **kiosk laptop**, edit `web/.env`:
   ```
   VITE_API_BASE_URL=http://<backend-PC-IP>:4000/api
   ```
   This one line covers both things the kiosk needs from the backend: fetching the ad playlist (`GET /api/ads`) and sending the finished QR session (`POST /api/sessions`) — `web` derives the ad-media origin from the same URL, so images/videos load automatically too.
3. Leave `kiosk-gpio-bridge`'s own address alone — it's always `http://localhost:5055` from the kiosk laptop's point of view, because the Arduino is plugged into that same laptop.
4. Start `kiosk-gpio-bridge` (`npm start`, with `ARDUINO_PORT` set) and `web` (`npm run dev`) on the laptop as normal.

Full topology diagram: [`../docs/network-topology-laptop-test.svg`](../docs/network-topology-laptop-test.svg).

## Raspberry Pi GPIO mode (real machine)

Used automatically when `ARDUINO_PORT` is not set and real GPIO pins are available (via [`onoff`](https://www.npmjs.com/package/onoff), Pi-only).

### Wiring (BCM pin numbers)

| Function | BCM GPIO | Header pin | Notes |
| --- | --- | --- | --- |
| Start button | GPIO17 | 11 | One leg to 3V3, other leg to GPIO17 + a 10kΩ pull-down to GND |
| Stop button | GPIO27 | 13 | Same pattern, GPIO27 |
| IR sensor OUT | GPIO22 | 15 | Sensor VCC→5V, GND→GND, OUT→GPIO22 |
| Buzzer + (optional) | GPIO23 | 16 | Buzzer − to GND |

Full wiring diagram: [`../docs/circuit-diagram.svg`](../docs/circuit-diagram.svg).

## Environment variables (`.env`)

All documented with inline comments in `.env.example`:
- **Arduino mode**: `ARDUINO_PORT`, `ARDUINO_BAUD_RATE` (default `9600`, must match the sketch's `Serial.begin(...)`)
- **GPIO mode**: `START_BUTTON_PIN`, `STOP_BUTTON_PIN`, `IR_SENSOR_PIN`, `BUZZER_PIN`, `IR_ACTIVE_LOW` (flip this if bottles aren't counting or are double-counting), `IR_DEBOUNCE_MS`, `BUTTON_DEBOUNCE_MS`
- **Both**: `PORT` (default `5055`)

## Running on boot (systemd) — Raspberry Pi only

```bash
sudo cp kiosk-gpio-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kiosk-gpio-bridge
sudo systemctl status kiosk-gpio-bridge   # confirm it's running
journalctl -u kiosk-gpio-bridge -f        # live logs
```

For the laptop+Arduino testing setup, just run `npm start` in a terminal — no systemd needed.

## Security note

This server intentionally binds to `127.0.0.1` only (loopback) — it should never be reachable over the network. It has no authentication of its own because it's not meant to be reachable by anything except the kiosk browser tab running on that same physical device.
