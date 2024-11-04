#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>

const char* ssid = "Your_SSID";
const char* password = "Your_PASSWORD";

const char* serverName = "server";
const int serverPort = 443;

const int mqSensorPin = A0;
const int motionSensorPin = D1;

WiFiClientSecure client;

void setup() {
  Serial.begin(115200);

  pinMode(mqSensorPin, INPUT);
  pinMode(motionSensorPin, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  client.setInsecure(); 
}

void loop() {
  int mqValue = analogRead(mqSensorPin);
  bool motionDetected = digitalRead(motionSensorPin) == HIGH;

  Serial.print("MQ Value: ");
  Serial.println(mqValue);
  Serial.print("Motion Detected: ");
  Serial.println(motionDetected ? "YES" : "NO");

  if (client.connect(serverName, serverPort)) {
    Serial.println("Connected to server");

    String url = "/labproject/sensor_data.php?mqValue=" + String(mqValue) +
                 "&motionDetected=" + (motionDetected ? "YES" : "NO");

    client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                 "Host: " + serverName + "\r\n" +
                 "Connection: close\r\n\r\n");

    while (client.connected() || client.available()) {
      if (client.available()) {
        String response = client.readStringUntil('\n');
        Serial.println(response);
      }
    }

    client.stop();
    Serial.println("Disconnected from server");
  } else {
    Serial.println("Connection to server failed");
  }

  delay(60000);
}
