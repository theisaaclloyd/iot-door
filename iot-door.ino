/* code for esp-01. written by Isaac Lloyd, April 2021
  normally open micro lever switch connected to pin 2
  when door is closed switch is closed and pin 2 is low
*/

#include "HTTPSRedirect.h"
#include <ESP8266WiFi.h>

#define ssid "your wifi ssid"
#define password "your wifi password"

#define pin 2 //Pin connected to switch

int state = 0;
int prevState = 0;

HTTPSRedirect client;

void setup() {
  Serial.begin(115200);

  pinMode(pin, INPUT_PULLUP);
  
  WiFi.mode(WIFI_STA);
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  IPAddress localIp = WiFi.localIP();
  Serial.println(localIp);
  delay(100);

  client.setInsecure();
  
  delay(1000);

  Serial.println(F("connecting to google"));
  if (!client.connect("script.google.com", 443)) {
    Serial.println(F("connection failed"));
    return;
  }
}

void updateSheet(String event) {
  Serial.println(F("connecting to google"));
  if (!client.connect("script.google.com", 443)) {
    Serial.println(F("connection failed"));
    return;
  }

  String line = "event=";
  line += event;

  Serial.print(F("Requesting url..."));
  client.POST("/macros/s/__GOOGLE SCRIPT ID__/exec", "script.google.com", line); // replace google script id with the one you get when you deploy the script as a web app
  
  Serial.println(F("request sent"));

  line = client.getResponseBody();
  Serial.print(line);
  
  Serial.println(F("closing connection"));
  client.stop();
}

void loop() {
  state = digitalRead(pin);
  if (state != prevState) {
    Serial.print("State changed: ");
    Serial.println(state == 0 ? "OPENED" : "CLOSED");
    updateSheet(state == 0 ? "OPENED" : "CLOSED");
    prevState = state;
    delay(100); //enough to debounce
  }
}
