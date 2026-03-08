/*
 * ESP32 Water Level Monitoring System
 * Multi-Tank  +  Motor Control  +  OTA-ready
 *
 * Hardware wiring
 * ──────────────────────────────────────────
 *  HC-SR04 VCC   →  ESP32 5 V
 *  HC-SR04 GND   →  ESP32 GND
 *  HC-SR04 TRIG  →  ESP32 GPIO 5
 *  HC-SR04 ECHO  →  ESP32 GPIO 18
 *  RELAY  IN     →  ESP32 GPIO 4
 *  LED (optional) → ESP32 GPIO 2 (built-in)
 *
 * Required Arduino libraries (install from Library Manager)
 *  • ArduinoJson  v7+
 *
 * Board: "ESP32 Dev Module" (or your variant)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ╔════════════════════════════════════════╗
// ║        *** USER CONFIG ***            ║
// ║  Change the values below, then upload ║
// ╚════════════════════════════════════════╝

// Wi-Fi
const char* ssid     = "Sampath";
const char* password = "1234567890";

// Backend URL — replace with your Render / local URL
// Examples:
//   Render  → "https://water-level-backend.onrender.com/api/water-level/update"
//   Local   → "http://192.168.1.100:5000/api/water-level/update"
const char* serverUrl = "https://water-level-backend.onrender.com/api/water-level/update";

// Tank ID — must match the tank registered on the website
const char* tankId = "tank-1";

// ── Pins ──
const int trigPin   = 5;
const int echoPin   = 18;
const int relayPin  = 4;
const int ledPin    = 2;   // built-in LED for status blink

// ── Tank dimensions (cm) ──
const int tankHeight   = 200;  // full water height capacity
const int sensorOffset = 10;   // gap from sensor face to tank top-edge

// ── Timing ──
const unsigned long SEND_INTERVAL_MS = 30000;   // upload every 30 s
const unsigned long WIFI_RETRY_MS    = 60000;   // retry WiFi every 60 s if lost
const unsigned long HTTP_TIMEOUT_MS  = 10000;   // HTTP request timeout

// ╔═══════════════════════════════════╗
// ║           INTERNALS               ║
// ╚═══════════════════════════════════╝
unsigned long lastSend      = 0;
unsigned long lastWifiRetry = 0;
bool motorOn                = false;
int  lastWaterLevel         = -1;
int  consecutiveFails       = 0;
const int MAX_FAILS         = 5;     // reboot if too many failures

// ── Forward declarations ──
void connectWiFi();
int  measureWaterLevel();
void sendData(int waterLevel);
void blinkLed(int times, int ms);

// ═══════════════════════════════════
//                SETUP
// ═══════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n╔══════════════════════════════════╗");
  Serial.println("║  AquaMonitor  –  ESP32 Firmware  ║");
  Serial.println("╚══════════════════════════════════╝");
  Serial.printf("  Tank ID : %s\n", tankId);
  Serial.printf("  Server  : %s\n", serverUrl);
  Serial.printf("  Interval: %lu s\n\n", SEND_INTERVAL_MS / 1000);

  pinMode(trigPin,  OUTPUT);
  pinMode(echoPin,  INPUT);
  pinMode(relayPin, OUTPUT);
  pinMode(ledPin,   OUTPUT);
  digitalWrite(relayPin, LOW);
  digitalWrite(ledPin,   LOW);

  connectWiFi();

  // Take an immediate first reading
  lastWaterLevel = measureWaterLevel();
  sendData(lastWaterLevel);
  lastSend = millis();

  blinkLed(3, 150);   // 3 quick blinks = ready
  Serial.println("Setup complete – monitoring started.\n");
}

// ═══════════════════════════════════
//                LOOP
// ═══════════════════════════════════
void loop() {
  // ── Reconnect WiFi if lost ──
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiRetry >= WIFI_RETRY_MS) {
      lastWifiRetry = millis();
      Serial.println("[WiFi] Attempting reconnect...");
      connectWiFi();
    }
  }

  // ── Periodic sensor read + upload ──
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    int level = measureWaterLevel();
    lastWaterLevel = level;
    sendData(level);
  }

  // ── Drive relay ──
  digitalWrite(relayPin, motorOn ? HIGH : LOW);

  // ── Status LED heartbeat (slow blink when connected) ──
  digitalWrite(ledPin, (millis() / 1000) % 2 == 0 && WiFi.status() == WL_CONNECTED);

  delay(100);
}

// ═══════════════════════════════════
//         WIFI CONNECTION
// ═══════════════════════════════════
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
    Serial.printf("\n[WiFi] Connected!  IP: %s  RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] FAILED – will retry later.");
  }
}

// ═══════════════════════════════════
//      ULTRASONIC MEASUREMENT
// ═══════════════════════════════════
int measureWaterLevel() {
  const int  NUM_SAMPLES = 7;
  int readings[NUM_SAMPLES];
  int validCount = 0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH, 30000);
    if (duration == 0) continue;            // skip timeouts

    int dist = (int)(duration * 0.0343 / 2.0);
    if (dist > 0 && dist < 500) {           // sane range check
      readings[validCount++] = dist;
    }
    delay(40);
  }

  if (validCount == 0) {
    Serial.println("[Sensor] No valid readings!");
    return lastWaterLevel >= 0 ? lastWaterLevel : 0;   // keep last known
  }

  // Simple median (sort then pick middle)
  for (int i = 0; i < validCount - 1; i++)
    for (int j = i + 1; j < validCount; j++)
      if (readings[j] < readings[i]) { int t = readings[i]; readings[i] = readings[j]; readings[j] = t; }

  int medianDist = readings[validCount / 2];
  int waterDepth = tankHeight - medianDist - sensorOffset;
  int level      = constrain(map(waterDepth, 0, tankHeight, 0, 100), 0, 100);

  Serial.printf("[Sensor] dist=%d cm  depth=%d cm  level=%d%%\n", medianDist, waterDepth, level);
  return level;
}

// ═══════════════════════════════════
//         SEND DATA TO API
// ═══════════════════════════════════
void sendData(int waterLevel) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped – WiFi not connected.");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT_MS);

  // Build JSON
  JsonDocument doc;
  doc["tankId"]     = tankId;
  doc["deviceId"]   = tankId;
  doc["waterLevel"] = waterLevel;

  String payload;
  serializeJson(doc, payload);

  Serial.printf("[HTTP] POST %s\n       %s\n", serverUrl, payload.c_str());

  int code = http.POST(payload);

  if (code == 200) {
    consecutiveFails = 0;
    String body = http.getString();
    Serial.printf("[HTTP] 200 OK  %s\n", body.c_str());

    // Parse motor command from response
    JsonDocument res;
    if (!deserializeJson(res, body) && res["motor"].is<JsonObject>()) {
      bool serverMotor = res["motor"]["isOn"] | false;
      if (serverMotor != motorOn) {
        motorOn = serverMotor;
        Serial.printf("[Motor] State changed → %s\n", motorOn ? "ON" : "OFF");
      }
    }
    blinkLed(1, 80);                     // quick blink = success
  } else {
    consecutiveFails++;
    Serial.printf("[HTTP] FAIL  code=%d  %s  (fails=%d/%d)\n",
                  code, http.errorToString(code).c_str(),
                  consecutiveFails, MAX_FAILS);

    if (consecutiveFails >= MAX_FAILS) {
      Serial.println("[System] Too many failures – rebooting...");
      delay(2000);
      ESP.restart();
    }
  }

  http.end();
}

// ═══════════════════════════════════
//           LED HELPER
// ═══════════════════════════════════
void blinkLed(int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(ledPin, HIGH); delay(ms);
    digitalWrite(ledPin, LOW);  delay(ms);
  }
}
