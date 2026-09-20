// Bridges the RVM's physical hardware (Start/Stop buttons + IR bottle
// sensor) to the kiosk web app over a local, loopback-only WebSocket.
//
// The kiosk UI runs in a normal Chromium browser tab, which has no access
// to GPIO or serial ports — so this small Node daemon owns the hardware and
// the browser just listens for events. Three interchangeable hardware
// backends are supported (the kiosk web app doesn't know or care which one
// is active, since all three just emit the same start/stop/bottle events):
//
//   1. Raspberry Pi GPIO   — the real RVM, pins read via `onoff`.
//   2. Arduino over USB    — a laptop standing in for the Pi during testing
//      (see the "arduino/" sketch in this folder); set ARDUINO_PORT to
//      enable this mode.
//   3. Keyboard simulator  — automatic fallback when neither of the above
//      is available, so the whole system stays testable with zero hardware:
//      press s / x / b + Enter in this terminal for Start / Stop / one bottle.
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 5055;
const START_BUTTON_PIN = Number(process.env.START_BUTTON_PIN) || 17;
const STOP_BUTTON_PIN = Number(process.env.STOP_BUTTON_PIN) || 27;
const IR_SENSOR_PIN = Number(process.env.IR_SENSOR_PIN) || 22;
const BUZZER_PIN = process.env.BUZZER_PIN ? Number(process.env.BUZZER_PIN) : null;
const IR_ACTIVE_LOW = String(process.env.IR_ACTIVE_LOW ?? 'true') === 'true';
const IR_DEBOUNCE_MS = Number(process.env.IR_DEBOUNCE_MS) || 300;
const BUTTON_DEBOUNCE_MS = Number(process.env.BUTTON_DEBOUNCE_MS) || 50;
const ARDUINO_PORT = process.env.ARDUINO_PORT || null;
const ARDUINO_BAUD_RATE = Number(process.env.ARDUINO_BAUD_RATE) || 9600;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: hardwareMode }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// Loopback-only: the kiosk browser tab runs on this same device, and GPIO
// control should never be reachable from the LAN.
const io = new Server(server, { cors: { origin: '*' } });

let hardwareMode = 'simulated';

function broadcast(event, payload) {
  console.log(`[gpio-bridge] ${event}`, payload || '');
  io.emit(event, payload || {});
}

function buzz(ms = 80) {
  if (!buzzerGpio) return;
  buzzerGpio.writeSync(1);
  setTimeout(() => buzzerGpio.writeSync(0), ms);
}

let buzzerGpio = null;

function startHardwareMode() {
  // eslint-disable-next-line global-require
  const { Gpio } = require('onoff');

  const startButton = new Gpio(START_BUTTON_PIN, 'in', 'rising', { debounceTimeout: BUTTON_DEBOUNCE_MS });
  const stopButton = new Gpio(STOP_BUTTON_PIN, 'in', 'rising', { debounceTimeout: BUTTON_DEBOUNCE_MS });
  const irSensor = new Gpio(IR_SENSOR_PIN, 'in', IR_ACTIVE_LOW ? 'falling' : 'rising');
  if (BUZZER_PIN !== null) buzzerGpio = new Gpio(BUZZER_PIN, 'out');

  startButton.watch((err) => {
    if (err) return console.error('[gpio-bridge] start button error', err);
    buzz(60);
    broadcast('start');
  });

  stopButton.watch((err) => {
    if (err) return console.error('[gpio-bridge] stop button error', err);
    buzz(60);
    broadcast('stop');
  });

  let lastBottleAt = 0;
  irSensor.watch((err) => {
    if (err) return console.error('[gpio-bridge] IR sensor error', err);
    const now = Date.now();
    if (now - lastBottleAt < IR_DEBOUNCE_MS) return; // ignore sensor bounce
    lastBottleAt = now;
    buzz(30);
    broadcast('bottle');
  });

  const cleanup = () => {
    [startButton, stopButton, irSensor, buzzerGpio].forEach((gpio) => {
      try {
        gpio && gpio.unexport();
      } catch {
        /* ignore */
      }
    });
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  hardwareMode = 'gpio';
  console.log(
    `[gpio-bridge] GPIO mode: start=GPIO${START_BUTTON_PIN} stop=GPIO${STOP_BUTTON_PIN} ir=GPIO${IR_SENSOR_PIN}` +
      (BUZZER_PIN !== null ? ` buzzer=GPIO${BUZZER_PIN}` : '')
  );
}

// Arduino mode: a laptop stands in for the Raspberry Pi during testing. The
// Arduino sketch in arduino/punoshristi_kiosk_bridge.ino reads the same
// buttons/IR sensor and just prints "START"/"STOP"/"BOTTLE" lines over USB
// serial — this function is the other half, turning those lines back into
// the same broadcast() events the GPIO and simulator modes emit, so the
// kiosk web app can't tell the difference.
function startArduinoMode() {
  // eslint-disable-next-line global-require
  const { SerialPort } = require('serialport');
  // eslint-disable-next-line global-require
  const { ReadlineParser } = require('@serialport/parser-readline');

  const port = new SerialPort({ path: ARDUINO_PORT, baudRate: ARDUINO_BAUD_RATE, autoOpen: false });

  port.open((err) => {
    if (err) {
      startSimulatedMode(`Could not open Arduino serial port ${ARDUINO_PORT} (${err.message})`);
      return;
    }

    hardwareMode = 'arduino';
    console.log(`[gpio-bridge] Arduino mode: listening on ${ARDUINO_PORT} @ ${ARDUINO_BAUD_RATE} baud`);

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    let lastBottleAt = 0;

    parser.on('data', (lineRaw) => {
      const line = String(lineRaw).trim().toUpperCase();
      if (line === 'START') broadcast('start');
      else if (line === 'STOP') broadcast('stop');
      else if (line === 'BOTTLE') {
        const now = Date.now();
        if (now - lastBottleAt < IR_DEBOUNCE_MS) return; // ignore sensor bounce
        lastBottleAt = now;
        broadcast('bottle');
      }
    });

    port.on('error', (serialErr) => {
      console.error('[gpio-bridge] Arduino serial error', serialErr.message);
    });

    const cleanup = () => {
      try {
        port.close();
      } catch {
        /* ignore */
      }
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });
}

function startSimulatedMode(reason) {
  hardwareMode = 'simulated';
  console.log(`[gpio-bridge] Falling back to keyboard simulator (${reason}).`);
}

// Keyboard override: always listening in this terminal, no matter which
// hardware mode ends up active. This matters when only *some* hardware is
// wired up yet — e.g. a real Arduino + IR sensor but no buttons — so Start/
// Stop can be triggered by hand while the real sensor drives bottle counts.
function attachKeyboardOverride() {
  console.log('[gpio-bridge] Manual override (always available): type "s" + Enter = Start, "x" + Enter = Stop, "b" + Enter = one bottle.');
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    const key = chunk.trim().toLowerCase();
    if (key === 's') broadcast('start');
    else if (key === 'x') broadcast('stop');
    else if (key === 'b') broadcast('bottle');
  });
}

attachKeyboardOverride();

// ARDUINO_PORT set → Arduino mode (falls back to the simulator asynchronously
// if the port can't be opened). Otherwise, try real Pi GPIO, and fall back to
// the simulator synchronously if that throws (e.g. `onoff` unavailable).
if (ARDUINO_PORT) {
  startArduinoMode();
} else {
  try {
    startHardwareMode();
  } catch (err) {
    startSimulatedMode(err.message);
  }
}

server.listen(PORT, '127.0.0.1', () => {
  // Arduino mode opens its serial port asynchronously and logs its own
  // confirmation line once ready, so `hardwareMode` here may still briefly
  // read its starting value — check GET /health for the current, accurate mode.
  console.log(`[gpio-bridge] Listening on http://127.0.0.1:${PORT} (mode: ${hardwareMode})`);
});
