// Bridges the RVM's physical hardware (Start/Stop buttons + IR bottle
// sensor) to the kiosk web app over a local, loopback-only WebSocket.
//
// The kiosk UI runs in a normal Chromium browser tab, which has no access
// to GPIO — so this small Node daemon owns the hardware and the browser
// just listens for events. Run this with `npm start` on the Raspberry Pi
// itself (see the systemd unit in this folder for auto-start on boot).
//
// On any machine that isn't a Raspberry Pi (or when the GPIO pins can't be
// exported, e.g. while developing on a laptop), this automatically falls
// back to a keyboard simulator so the rest of the system stays testable
// without hardware: press s / x / b + Enter in this terminal to simulate
// Start / Stop / one bottle.
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

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: hardwareMode ? 'gpio' : 'simulated' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// Loopback-only: the kiosk browser tab runs on this same device, and GPIO
// control should never be reachable from the LAN.
const io = new Server(server, { cors: { origin: '*' } });

let hardwareMode = false;

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

  hardwareMode = true;
  console.log(
    `[gpio-bridge] GPIO mode: start=GPIO${START_BUTTON_PIN} stop=GPIO${STOP_BUTTON_PIN} ir=GPIO${IR_SENSOR_PIN}` +
      (BUZZER_PIN !== null ? ` buzzer=GPIO${BUZZER_PIN}` : '')
  );
}

function startSimulatedMode(reason) {
  hardwareMode = false;
  console.log(`[gpio-bridge] Falling back to keyboard simulator (${reason}).`);
  console.log('[gpio-bridge] In this terminal: type "s" + Enter = Start, "x" + Enter = Stop, "b" + Enter = one bottle.');

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    const key = chunk.trim().toLowerCase();
    if (key === 's') broadcast('start');
    else if (key === 'x') broadcast('stop');
    else if (key === 'b') broadcast('bottle');
  });
}

try {
  startHardwareMode();
} catch (err) {
  startSimulatedMode(err.message);
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[gpio-bridge] Listening on http://127.0.0.1:${PORT} (mode: ${hardwareMode ? 'gpio' : 'simulated'})`);
});
