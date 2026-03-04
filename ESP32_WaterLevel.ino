/*
 * ESP32 Water Level Monitoring System
 * 
 * Measures water level using HC-SR04 ultrasonic sensor
 * Sends data to backend API every 30 seconds
 * 
 * Hardware:
 * - ESP32 Dev Board
 * - HC-SR04 Ultrasonic Sensor
 * 
 * Connections:
 * HC-SR04 VCC  -> ESP32 5V
 * HC-SR04 GND  -> ESP32 GND
 * HC-SR04 TRIG -> ESP32 GPIO 5
 * HC-SR04 ECHO -> ESP32 GPIO 18
 * 
 * Required Libraries:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - ArduinoJson (install from Library Manager)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============ CONFIGURATION ============
// Update these values before uploading!

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL (update with your Render backend URL)
const char* serverUrl = "https://your-backend-url.onrender.com/api/water-level/update";

// Device ID (unique identifier for this ESP32)
const char* deviceId = "ESP32-001";

// Sensor pins
const int trigPin = 5;
const int echoPin = 18;

// Tank configuration (in centimeters)
const int tankHeight = 200;  // Total height of your water tank
const int sensorOffset = 10;  // Distance from sensor to tank top

// Update interval (milliseconds)
const unsigned long updateInterval = 30000; // 30 seconds

// ============ GLOBAL VARIABLES ============
unsigned long lastUpdate = 0;

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("Water Level Monitoring System");
  Serial.println("ESP32 + HC-SR04");
  Serial.println("=================================\n");
  
  // Initialize sensor pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\nSetup complete!");
  Serial.println("Starting measurements...\n");
}

void loop() {
  // Check if it's time to update
  if (millis() - lastUpdate >= updateInterval) {
    lastUpdate = millis();
    
    // Measure water level
    int waterLevel = measureWaterLevel();
    
    // Send data to server
    sendData(waterLevel);
  }
  
  delay(100); // Small delay to prevent busy-waiting
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("Please check your credentials and try again.");
  }
}

int measureWaterLevel() {
  // Take multiple readings for accuracy
  const int numReadings = 5;
  long totalDistance = 0;
  
  for (int i = 0; i < numReadings; i++) {
    // Clear trigger pin
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    
    // Send ultrasonic pulse
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    // Measure echo duration
    long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
    
    if (duration == 0) {
      Serial.println("⚠ Sensor timeout - check connections");
      continue;
    }
    
    // Calculate distance (speed of sound = 343 m/s = 0.0343 cm/µs)
    int distance = duration * 0.0343 / 2;
    totalDistance += distance;
    
    delay(50); // Short delay between readings
  }
  
  // Average distance
  int avgDistance = totalDistance / numReadings;
  
  // Adjust for sensor offset
  int waterDepth = tankHeight - avgDistance - sensorOffset;
  
  // Calculate percentage (0-100%)
  int waterLevel = map(waterDepth, 0, tankHeight, 0, 100);
  waterLevel = constrain(waterLevel, 0, 100);
  
  // Display readings
  Serial.println("--- Measurement ---");
  Serial.print("Distance: ");
  Serial.print(avgDistance);
  Serial.println(" cm");
  Serial.print("Water depth: ");
  Serial.print(waterDepth);
  Serial.println(" cm");
  Serial.print("Water level: ");
  Serial.print(waterLevel);
  Serial.println("%");
  
  return waterLevel;
}

void sendData(int waterLevel) {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected. Reconnecting...");
    connectWiFi();
    return;
  }
  
  HTTPClient http;
  
  Serial.println("\n--- Sending to Server ---");
  Serial.print("URL: ");
  Serial.println(serverUrl);
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["waterLevel"] = waterLevel;
  
  // Add timestamp (optional - server can use its own)
  // doc["timestamp"] = ""; 
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.print("Payload: ");
  Serial.println(jsonData);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonData);
  
  // Handle response
  if (httpResponseCode > 0) {
    Serial.print("✓ Response code: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.print("✗ Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  Serial.println("-------------------\n");
}

// WiFi event handlers
void WiFiEvent(WiFiEvent_t event) {
  switch(event) {
    case SYSTEM_EVENT_STA_DISCONNECTED:
      Serial.println("⚠ WiFi disconnected!");
      break;
    case SYSTEM_EVENT_STA_GOT_IP:
      Serial.println("✓ WiFi reconnected!");
      break;
  }
}
