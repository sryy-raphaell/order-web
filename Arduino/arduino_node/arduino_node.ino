/*
 * Arduino Uno R3 — Sensor Node
 * Baca: DHT22 x2, DS18B20 x2 (one-wire), Relay 4 channel
 * Kirim ke ESP32 via Serial (TX pin 1) setiap 3 detik
 *
 * Wiring:
 *   DHT22 #1  → Digital pin 2  (data)
 *   DHT22 #2  → Digital pin 3  (data)
 *   DS18B20   → Digital pin 4  (one-wire, semua sensor satu bus)
 *   Relay ch0 → Digital pin 8
 *   Relay ch1 → Digital pin 9
 *   Relay ch2 → Digital pin 10
 *   Relay ch3 → Digital pin 11
 *
 * Library yang dibutuhkan:
 *   - DHT sensor library (Adafruit)
 *   - OneWire
 *   - DallasTemperature
 *   - ArduinoJson (v6)
 *
 * Format output Serial (JSON, satu baris):
 *   {"d":"ARDUINO-NODE","t":28.5,"h":65.2,"p":{"V2":25.1,"V3":24.8},"r":{"0":false,"1":false,"2":false,"3":false}}
 *   d  = deviceName (untuk DHT22 utama)
 *   t  = temperature DHT22 #1
 *   h  = humidity DHT22 #1
 *   p  = virtual pins (DS18B20 di V2/V3, DHT22 #2 temp di V0, hum di V1)
 *   r  = relay states (read from ESP32 response)
 */

#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ── Pin config ──────────────────────────────────────────────────────────────
#define DHT1_PIN    2
#define DHT2_PIN    3
#define DS18B20_PIN 4
#define DHT_TYPE    DHT22

#define RELAY_CH0   8
#define RELAY_CH1   9
#define RELAY_CH2   10
#define RELAY_CH3   11

#define RELAY_ACTIVE LOW   // LOW = aktif untuk relay modul umum (active-low)
                           // Ganti HIGH jika modul relay kamu active-high

// ── Objects ─────────────────────────────────────────────────────────────────
DHT dht1(DHT1_PIN, DHT_TYPE);
DHT dht2(DHT2_PIN, DHT_TYPE);
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

// ── Relay state ─────────────────────────────────────────────────────────────
bool relayState[4] = { false, false, false, false };
const int RELAY_PINS[4] = { RELAY_CH0, RELAY_CH1, RELAY_CH2, RELAY_CH3 };

String serialInBuffer = "";

// ── Setup ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);  // Komunikasi ke ESP32

  dht1.begin();
  dht2.begin();
  ds18b20.begin();

  // Init relay pins (off semua)
  for (int i = 0; i < 4; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], !RELAY_ACTIVE);  // Mulai OFF
  }
}

// ── Apply relay states dari ESP32 ───────────────────────────────────────────
void applyRelays() {
  for (int i = 0; i < 4; i++) {
    digitalWrite(RELAY_PINS[i], relayState[i] ? RELAY_ACTIVE : !RELAY_ACTIVE);
  }
}

// ── Parse relay command dari ESP32 ─────────────────────────────────────────
// Format: {"relays":{"0":false,"1":true,"2":false,"3":false}}
void parseRelayCommand(String& line) {
  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, line) != DeserializationError::Ok) return;
  if (!doc.containsKey("relays")) return;

  JsonObject r = doc["relays"].as<JsonObject>();
  for (int i = 0; i < 4; i++) {
    String key = String(i);
    if (r.containsKey(key)) {
      relayState[i] = r[key].as<bool>();
    }
  }
  applyRelays();
}

// ── Kirim data sensor ────────────────────────────────────────────────────────
void sendSensorData() {
  // Baca DHT22 #1
  float temp1 = dht1.readTemperature();
  float hum1  = dht1.readHumidity();

  // Baca DHT22 #2
  float temp2 = dht2.readTemperature();
  float hum2  = dht2.readHumidity();

  // Baca DS18B20 (semua sensor di bus)
  ds18b20.requestTemperatures();
  float dsTemp0 = ds18b20.getTempCByIndex(0);
  float dsTemp1 = ds18b20.getTempCByIndex(1);

  // Validasi DHT22 #1 (data utama)
  if (isnan(temp1) || isnan(hum1)) return;

  // Build JSON — gunakan key pendek untuk hemat memori
  StaticJsonDocument<512> doc;
  doc["d"] = "ARDUINO-NODE";  // deviceName
  doc["t"] = round(temp1 * 10) / 10.0;
  doc["h"] = round(hum1  * 10) / 10.0;

  // Virtual pins
  JsonObject pins = doc.createNestedObject("p");
  if (!isnan(temp2)) pins["V0"] = round(temp2 * 10) / 10.0;  // DHT22 #2 temp
  if (!isnan(hum2))  pins["V1"] = round(hum2  * 10) / 10.0;  // DHT22 #2 hum
  if (dsTemp0 != DEVICE_DISCONNECTED_C) pins["V2"] = round(dsTemp0 * 100) / 100.0;
  if (dsTemp1 != DEVICE_DISCONNECTED_C) pins["V3"] = round(dsTemp1 * 100) / 100.0;

  // Relay states
  JsonObject relays = doc.createNestedObject("r");
  for (int i = 0; i < 4; i++) {
    relays[String(i)] = relayState[i];
  }

  // Kirim via Serial
  serializeJson(doc, Serial);
  Serial.println();
}

// ── Loop ────────────────────────────────────────────────────────────────────
unsigned long lastSend = 0;
const unsigned long INTERVAL = 3000; // 3 detik

void loop() {
  // Terima relay command dari ESP32
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      serialInBuffer.trim();
      if (serialInBuffer.length() > 2) {
        parseRelayCommand(serialInBuffer);
      }
      serialInBuffer = "";
    } else if (c != '\r') {
      serialInBuffer += c;
    }
  }

  // Kirim data setiap INTERVAL ms
  if (millis() - lastSend >= INTERVAL) {
    lastSend = millis();
    sendSensorData();
  }
}
