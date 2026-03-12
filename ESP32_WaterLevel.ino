/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         AquaMonitor – ESP32 Final Firmware v3.0             ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  API Endpoints Used:                                         ║
 * ║   POST /api/water-level/update   → send water level         ║
 * ║   GET  /api/motor/:tankId        → poll motor status        ║
 * ║   (toggle & mode changed via website only)                  ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Telegram Alerts:                                            ║
 * ║   ✅ Device online                                           ║
 * ║   ⚙️  Motor ON / 🛑 Motor OFF                               ║
 * ║   ⚠️  Low water (≤20%)                                      ║
 * ║   🚰 Tank full (≥90%)                                       ║
 * ║   ❌ Server error → auto reboot                             ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Hardware Wiring:                                            ║
 * ║   HC-SR04 VCC  → ESP32 5V (VIN)                            ║
 * ║   HC-SR04 GND  → ESP32 GND                                 ║
 * ║   HC-SR04 TRIG → ESP32 GPIO 5                              ║
 * ║   HC-SR04 ECHO → ESP32 GPIO 18 (via voltage divider)       ║
 * ║     ECHO → 1kΩ → GPIO18, middle junction → 2kΩ → GND      ║
 * ║   Relay VCC    → ESP32 5V (VIN)                            ║
 * ║   Relay GND    → ESP32 GND                                 ║
 * ║   Relay IN     → ESP32 GPIO 4                              ║
 * ║   Relay COM    → Power Supply (+)                          ║
 * ║   Relay NO     → Motor (+) wire                            ║
 * ║   Motor (-)    → Power Supply (-)                          ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Required Library: ArduinoJson v7+ (Library Manager)        ║
 * ║  Board: ESP32 Dev Module                                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ╔════════════════════════════════════════════════════╗
// ║              *** USER CONFIG ***                  ║
// ╚════════════════════════════════════════════════════╝

// ── WiFi ──
const char* ssid     = "Sampath";
const char* password = "1234567890";

// ── Backend URLs (your existing Render backend) ──
const char* urlWaterLevel  = "https://water-level-backend.onrender.com/api/water-level/update";
const char* urlMotorStatus = "https://water-level-backend.onrender.com/api/motor/tank-1";

// ── Tank ID ──
const char* tankId = "tank-1";

// ── Telegram ──
const char* telegramToken  = "8794462373:AAHNmBDDJ6tksqpXH-kiEmmpFIWuoy3CCUw";
const char* telegramChatId = "6639897810";

// ── GPIO Pins ──
const int TRIG_PIN  = 5;
const int ECHO_PIN  = 18;
const int RELAY_PIN = 4;
const int LED_PIN   = 2;

// ── Tank Dimensions (cm) ──
const int TANK_HEIGHT   = 200;   // full tank height in cm
const int SENSOR_OFFSET = 10;    // gap from sensor face to tank top edge

// ── Alert Thresholds (%) ──
const int LEVEL_LOW  = 20;   // ⚠ Low water alert below this
const int LEVEL_HIGH = 90;   // 🚰 Tank full alert above this

// ── Timing ──
const unsigned long INTERVAL_SEND_DATA     = 30000;  // send water level every 30s
const unsigned long INTERVAL_MOTOR_POLL    = 5000;   // poll motor status every 5s
const unsigned long INTERVAL_WIFI_RETRY    = 60000;  // retry WiFi every 60s
const unsigned long HTTP_TIMEOUT           = 10000;  // HTTP request timeout

// ╔════════════════════════════════════════════════════╗
// ║                   INTERNALS                       ║
// ╚════════════════════════════════════════════════════╝
unsigned long lastSendData   = 0;
unsigned long lastMotorPoll  = 0;
unsigned long lastWifiRetry  = 0;

bool motorIsOn      = false;
bool lastMotorState = false;

int  lastWaterLevel   = -1;
int  consecutiveFails = 0;
const int MAX_FAILS   = 5;

bool alertLowSent  = false;
bool alertHighSent = false;

// ── Forward Declarations ──
void connectWiFi();
int  measureWaterLevel();
void sendWaterLevel(int level);
void pollMotorStatus();
void sendTelegram(String msg);
void checkWaterAlerts(int level);
void handleMotorChange();
void blinkLed(int times, int ms);


// ════════════════════════════════════════════════════
//  SETUP
// ════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║   AquaMonitor  –  ESP32  v3.0        ║");
  Serial.println("╚══════════════════════════════════════╝");
  Serial.printf("  Tank     : %s\n", tankId);
  Serial.printf("  Upload   : every %lus\n", INTERVAL_SEND_DATA / 1000);
  Serial.printf("  Motor Poll: every %lus\n\n", INTERVAL_MOTOR_POLL / 1000);

  pinMode(TRIG_PIN,  OUTPUT);
  pinMode(ECHO_PIN,  INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN,   OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN,   LOW);

  connectWiFi();

  // Boot notification
  sendTelegram(
    "✅ *AquaMonitor Online*\n"
    "Tank: `" + String(tankId) + "`\n"
    "Device started and monitoring."
  );

  // First reading immediately
  lastWaterLevel = measureWaterLevel();
  sendWaterLevel(lastWaterLevel);
  pollMotorStatus();
  checkWaterAlerts(lastWaterLevel);

  lastSendData  = millis();
  lastMotorPoll = millis();

  blinkLed(3, 150);
  Serial.println("✔ Ready — monitoring started.\n");
}


// ════════════════════════════════════════════════════
//  LOOP
// ════════════════════════════════════════════════════
void loop() {

  // 1. WiFi watchdog
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiRetry >= INTERVAL_WIFI_RETRY) {
      lastWifiRetry = millis();
      Serial.println("[WiFi] Lost — reconnecting...");
      connectWiFi();
    }
  }

  // 2. Send water level every 30s
  if (millis() - lastSendData >= INTERVAL_SEND_DATA) {
    lastSendData   = millis();
    lastWaterLevel = measureWaterLevel();
    sendWaterLevel(lastWaterLevel);
    checkWaterAlerts(lastWaterLevel);
  }

  // 3. Poll motor status from server every 5s
  if (millis() - lastMotorPoll >= INTERVAL_MOTOR_POLL) {
    lastMotorPoll = millis();
    pollMotorStatus();
  }

  // 4. Drive relay
  digitalWrite(RELAY_PIN, motorIsOn ? HIGH : LOW);

  // 5. Detect motor state change → Telegram
  handleMotorChange();

  // 6. Heartbeat LED (blink every 500ms when WiFi OK)
  bool wifiOk = (WiFi.status() == WL_CONNECTED);
  digitalWrite(LED_PIN, wifiOk && ((millis() / 500) % 2 == 0));

  delay(100);
}


// ════════════════════════════════════════════════════
//  WIFI
// ════════════════════════════════════════════════════
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to \"%s\" ", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(1000);
    Serial.print('.');
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] ✔ Connected — IP: %s  RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] ✘ Failed — will retry later.");
  }
}


// ════════════════════════════════════════════════════
//  MEASURE WATER LEVEL  (HC-SR04 median of 7 samples)
// ════════════════════════════════════════════════════
int measureWaterLevel() {
  const int SAMPLES = 7;
  int readings[SAMPLES];
  int validCount = 0;

  for (int i = 0; i < SAMPLES; i++) {
    digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    if (duration == 0) { delay(40); continue; }

    int dist = (int)(duration * 0.0343 / 2.0);
    if (dist >= 2 && dist <= 400) readings[validCount++] = dist;
    delay(40);
  }

  if (validCount == 0) {
    Serial.println("[Sensor] ⚠ No valid readings — using last known.");
    return (lastWaterLevel >= 0) ? lastWaterLevel : 0;
  }

  // Sort → median
  for (int i = 0; i < validCount - 1; i++)
    for (int j = i + 1; j < validCount; j++)
      if (readings[j] < readings[i]) {
        int t = readings[i]; readings[i] = readings[j]; readings[j] = t;
      }

  int medDist    = readings[validCount / 2];
  int waterDepth = constrain(TANK_HEIGHT - medDist - SENSOR_OFFSET, 0, TANK_HEIGHT);
  int level      = constrain(map(waterDepth, 0, TANK_HEIGHT, 0, 100), 0, 100);

  Serial.printf("[Sensor] dist=%d cm  depth=%d cm  level=%d%%\n", medDist, waterDepth, level);
  return level;
}


// ════════════════════════════════════════════════════
//  SEND WATER LEVEL  →  POST /api/water-level/update
//  Response also contains motor state (used as fallback)
// ════════════════════════════════════════════════════
void sendWaterLevel(int level) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[sendData] Skipped — no WiFi.");
    return;
  }

  HTTPClient http;
  http.begin(urlWaterLevel);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT);

  JsonDocument doc;
  doc["tankId"]     = tankId;
  doc["deviceId"]   = tankId;
  doc["waterLevel"] = level;

  String body;
  serializeJson(doc, body);

  Serial.printf("[sendData] POST level=%d%%\n", level);
  int code = http.POST(body);

  if (code == 200) {
    consecutiveFails = 0;
    String resp = http.getString();
    Serial.printf("[sendData] ✔ 200 OK — %s\n", resp.c_str());

    // Parse motor fallback from response
    JsonDocument res;
    if (!deserializeJson(res, resp) && res["motor"].is<JsonObject>()) {
      bool newState = res["motor"]["isOn"] | false;
      if (newState != motorIsOn) {
        motorIsOn = newState;
        Serial.printf("[Motor] Updated from sendData response → %s\n", motorIsOn ? "ON" : "OFF");
      }
    }
    blinkLed(1, 80);

  } else {
    consecutiveFails++;
    Serial.printf("[sendData] ✘ FAIL code=%d  (%d/%d)\n", code, consecutiveFails, MAX_FAILS);

    if (consecutiveFails >= MAX_FAILS) {
      sendTelegram(
        "❌ *AquaMonitor ERROR*\n"
        "Tank: `" + String(tankId) + "`\n"
        "Server unreachable after " + String(MAX_FAILS) + " attempts.\n"
        "Rebooting now..."
      );
      Serial.println("[System] Too many failures — rebooting in 3s...");
      delay(3000);
      ESP.restart();
    }
  }
  http.end();
}


// ════════════════════════════════════════════════════
//  POLL MOTOR STATUS  →  GET /api/motor/:tankId
//  Called every 5s so ESP32 instantly picks up
//  changes made on the website (manual toggle / mode)
// ════════════════════════════════════════════════════
void pollMotorStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(urlMotorStatus);
  http.setTimeout(HTTP_TIMEOUT);

  int code = http.GET();

  if (code == 200) {
    String resp = http.getString();

    JsonDocument res;
    if (!deserializeJson(res, resp)) {

      bool newState = false;

      // Handle both response shapes:
      // { "motor": { "isOn": true } }  or  { "isOn": true }
      if (res["motor"].is<JsonObject>()) {
        newState = res["motor"]["isOn"] | false;
      } else {
        newState = res["isOn"] | false;
      }

      if (newState != motorIsOn) {
        motorIsOn = newState;
        Serial.printf("[pollMotor] State changed → %s\n", motorIsOn ? "ON ⚙" : "OFF 🛑");
      }
    }
  } else {
    Serial.printf("[pollMotor] ✘ code=%d\n", code);
  }

  http.end();
}


// ════════════════════════════════════════════════════
//  MOTOR STATE CHANGE HANDLER
//  Detects ON→OFF or OFF→ON and sends Telegram
// ════════════════════════════════════════════════════
void handleMotorChange() {
  if (motorIsOn == lastMotorState) return;
  lastMotorState = motorIsOn;

  if (motorIsOn) {
    sendTelegram(
      "⚙️ *Motor TURNED ON*\n"
      "Tank: `" + String(tankId) + "`\n"
      "💧 Water Level: *" + String(lastWaterLevel) + "%*\n"
      "Pump is now running."
    );
    Serial.println("[Motor] ⚙ ON — Telegram sent.");
  } else {
    sendTelegram(
      "🛑 *Motor TURNED OFF*\n"
      "Tank: `" + String(tankId) + "`\n"
      "💧 Water Level: *" + String(lastWaterLevel) + "%*\n"
      "Pump has stopped."
    );
    Serial.println("[Motor] 🛑 OFF — Telegram sent.");
  }
}


// ════════════════════════════════════════════════════
//  WATER LEVEL ALERT CHECKER
//  Fires Telegram once per threshold crossing
// ════════════════════════════════════════════════════
void checkWaterAlerts(int level) {

  // LOW WATER
  if (level <= LEVEL_LOW && !alertLowSent) {
    alertLowSent  = true;
    alertHighSent = false;
    sendTelegram(
      "⚠️ *LOW WATER ALERT!*\n"
      "Tank: `" + String(tankId) + "`\n"
      "💧 Level: *" + String(level) + "%*\n"
      "Below threshold of " + String(LEVEL_LOW) + "%.\n"
      "Please check your water supply."
    );
    Serial.println("[Alert] ⚠ LOW WATER — Telegram sent.");
  }

  // TANK FULL
  else if (level >= LEVEL_HIGH && !alertHighSent) {
    alertHighSent = true;
    alertLowSent  = false;
    sendTelegram(
      "🚰 *TANK FULL!*\n"
      "Tank: `" + String(tankId) + "`\n"
      "💧 Level: *" + String(level) + "%*\n"
      "Above " + String(LEVEL_HIGH) + "% — motor should turn OFF."
    );
    Serial.println("[Alert] 🚰 TANK FULL — Telegram sent.");
  }

  // Mid range — reset both flags so alerts fire again next cycle
  if (level > LEVEL_LOW && level < LEVEL_HIGH) {
    alertLowSent  = false;
    alertHighSent = false;
  }
}


// ════════════════════════════════════════════════════
//  SEND TELEGRAM MESSAGE
// ════════════════════════════════════════════════════
void sendTelegram(String message) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Telegram] Skipped — no WiFi.");
    return;
  }

  String url = "https://api.telegram.org/bot";
  url += telegramToken;
  url += "/sendMessage";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT);

  JsonDocument doc;
  doc["chat_id"]    = telegramChatId;
  doc["text"]       = message;
  doc["parse_mode"] = "Markdown";

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code == 200) {
    Serial.println("[Telegram] ✔ Sent.");
  } else {
    Serial.printf("[Telegram] ✘ FAIL code=%d\n", code);
  }
  http.end();
}


// ════════════════════════════════════════════════════
//  LED BLINK HELPER
// ════════════════════════════════════════════════════
void blinkLed(int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH); delay(ms);
    digitalWrite(LED_PIN, LOW);  delay(ms);
  }
}
