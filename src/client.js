var mqtt = require('mqtt')
const MQTT_URL = 'mqtt://mqtt.panerahackathon.com';

const orderManager = require('./OrderManager.js');

// MQTT Client
console.log('connecing to', MQTT_URL)
const client = mqtt.connect(MQTT_URL)

client.on('connect', function () {
  console.log('connected to', MQTT_URL);
  client.subscribe('ingredient/pulled');
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  const messageStr = message.toString();
  if (topic === 'ingredient/pulled') {
    orderManager.addIngredient(JSON.parse(messageStr));
  }
})

module.exports = client;