/*
 * ESP32 — IoT Gateway
 * Menerima data sensor dari Arduino Uno via Serial2,
 * lalu mengirim ke Next.js API dengan authToken project.
 *
 * Wiring:
 *   Arduino TX  → ESP32 RX2 (GPIO16)
 *   Arduino GND → ESP32 GND
 *   (tidak perlu TX ESP32 → Arduino untuk setup ini)
 *
 * Format data dari Arduino (satu baris JSON):
 *   {"d":"DHT22-1","t":28.5,"h":65.2,"r":{"0":false,"1":false}}
 *   d = deviceName, t = temperature, h = humidity
 *   r = relay states (opsional), p = virtual pins (opsional)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Config ─────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "Raphael";
const char* WIFI_PASS     = "Raphael24";
const char* SERVER_URL    = "https://order-web-dun.vercel.app";
const char* AUTH_TOKEN    = "cmq0e765w0000mrlpihj2s4ku";

// Serial2 pins untuk komunikasi dengan Arduino
#define ARDUINO_RX 16   // ESP32 GPIO16 ← Arduino TX
#define ARDUINO_TX 17   // ESP32 GPIO17 → Arduino RX (opsional)
#define BAUD_ARDUINO 9600

// ── State ──────────────────────────────────────────────────────────────────
String serialBuffer = "";

void setup() {
  Serial.begin(115200);
  Serial2.begin(BAUD_ARDUINO, SERIAL_8N1, ARDUINO_RX, ARDUINO_TX);

  Serial.println("\n=== ESP32 IoT Gateway ===");

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n✗ WiFi gagal, cek kredensial");
  }
}

// ── Kirim data ke API ───────────────────────────────────────────────────────
void sendToAPI(JsonDocument& doc) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected");
    return;
  }

  // Tambahkan authToken ke payload
  doc["authToken"] = AUTH_TOKEN;

  String body;
  serializeJson(doc, body);
  Serial.println("[SEND] " + body);

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/iot/update";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int code = http.POST(body);

  if (code > 0) {
    String response = http.getString();
    Serial.println("[RESP] " + response);

    // Parse relay state dari response → kirim ke Arduino via Serial2
    StaticJsonDocument<256> res;
    if (deserializeJson(res, response) == DeserializationError::Ok) {
      // Kirim relay states ke Arduino: {"relays":{"0":false,"1":true,...}}
      String relayMsg;
      StaticJsonDocument<128> relayDoc;
      relayDoc["relays"] = res["relays"];
      serializeJson(relayDoc, relayMsg);
      Serial2.println(relayMsg);
      Serial.println("[RELAY→Arduino] " + relayMsg);
    }
  } else {
    Serial.println("[HTTP] Error: " + String(code));
  }

  http.end();
}

// ── Main loop ───────────────────────────────────────────────────────────────
void loop() {
  // Baca data dari Arduino line by line
  while (Serial2.available()) {
    char c = Serial2.read();
    if (c == '\n') {
      serialBuffer.trim();
      if (serialBuffer.length() > 0) {
        Serial.println("[Arduino] " + serialBuffer);

        StaticJsonDocument<512> doc;
        DeserializationError err = deserializeJson(doc, serialBuffer);

        if (err == DeserializationError::Ok) {
          // Validasi minimal ada deviceName
          if (doc.containsKey("d")) {
            doc["deviceName"] = doc["d"];  // rename key
            doc.remove("d");
            if (doc.containsKey("t")) { doc["temperature"] = doc["t"]; doc.remove("t"); }
            if (doc.containsKey("h")) { doc["humidity"]    = doc["h"]; doc.remove("h"); }
            if (doc.containsKey("p")) { doc["pins"]        = doc["p"]; doc.remove("p"); }
            if (doc.containsKey("r")) { doc["relays"]      = doc["r"]; doc.remove("r"); }
            sendToAPI(doc);
          }
        } else {
          Serial.println("[PARSE ERR] " + String(err.c_str()));
        }
      }
      serialBuffer = "";
    } else if (c != '\r') {
      serialBuffer += c;
      if (serialBuffer.length() > 512) serialBuffer = ""; // overflow guard
    }
  }
}
