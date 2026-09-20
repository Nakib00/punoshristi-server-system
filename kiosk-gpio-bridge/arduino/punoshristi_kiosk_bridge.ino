// Punoshristi RVM — Arduino kiosk bridge sketch
//
// Stands in for the Raspberry Pi's GPIO pins while testing on a laptop: reads
// the Start/Stop buttons and the IR bottle sensor, and reports each event to
// the laptop over the same USB cable used to power/program the Arduino, as a
// plain text line ("START" / "STOP" / "BOTTLE").
//
// The laptop runs `kiosk-gpio-bridge` (this project's Node service) with
// ARDUINO_PORT set in its .env — that service reads these lines and turns
// them into the same events the kiosk web app already listens for, so
// nothing in the web app needs to change between Pi/GPIO, Arduino, or the
// keyboard simulator.
//
// Wiring (Arduino Uno/Nano — see docs/circuit-diagram-arduino.svg):
//   Start button  -> D2, other leg -> GND   (uses the internal pull-up, no resistor needed)
//   Stop button   -> D3, other leg -> GND   (same)
//   IR sensor OUT -> D4   (sensor VCC -> 5V, sensor GND -> GND)
//   Buzzer + (optional) -> D8, buzzer − -> GND
//
// If your IR module reports the opposite way round (HIGH when a bottle is
// detected instead of LOW), flip IR_ACTIVE_LOW below.

const int START_PIN = 2;
const int STOP_PIN = 3;
const int IR_PIN = 4;
const int BUZZER_PIN = 8;
const bool IR_ACTIVE_LOW = true; // most cheap IR obstacle modules (e.g. FC-51) pull OUT low when triggered

const unsigned long BUTTON_DEBOUNCE_MS = 50;
const unsigned long IR_DEBOUNCE_MS = 300;

int lastStartState = HIGH;
int lastStopState = HIGH;
int lastIrState = HIGH;
unsigned long lastStartChangeAt = 0;
unsigned long lastStopChangeAt = 0;
unsigned long lastBottleAt = 0;

void beep(int ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void setup() {
  Serial.begin(9600);
  pinMode(START_PIN, INPUT_PULLUP);
  pinMode(STOP_PIN, INPUT_PULLUP);
  pinMode(IR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  lastIrState = digitalRead(IR_PIN);
}

void loop() {
  unsigned long now = millis();

  // Buttons: internal pull-up means the pin reads HIGH when open, LOW when
  // pressed (the button just shorts the pin to GND) — no external resistor.
  int startState = digitalRead(START_PIN);
  if (startState != lastStartState && now - lastStartChangeAt > BUTTON_DEBOUNCE_MS) {
    lastStartChangeAt = now;
    lastStartState = startState;
    if (startState == LOW) {
      Serial.println("START");
      beep(60);
    }
  }

  int stopState = digitalRead(STOP_PIN);
  if (stopState != lastStopState && now - lastStopChangeAt > BUTTON_DEBOUNCE_MS) {
    lastStopChangeAt = now;
    lastStopState = stopState;
    if (stopState == LOW) {
      Serial.println("STOP");
      beep(60);
    }
  }

  // IR sensor: only fire on the transition into the "triggered" state, not
  // for as long as the beam stays broken.
  int irState = digitalRead(IR_PIN);
  bool triggeredNow = IR_ACTIVE_LOW ? (irState == LOW) : (irState == HIGH);
  bool wasTriggered = IR_ACTIVE_LOW ? (lastIrState == LOW) : (lastIrState == HIGH);
  if (triggeredNow && !wasTriggered && now - lastBottleAt > IR_DEBOUNCE_MS) {
    lastBottleAt = now;
    Serial.println("BOTTLE");
    beep(30);
  }
  lastIrState = irState;
}
