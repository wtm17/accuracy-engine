var mqtt = require('mqtt')
const MQTT_URL = 'mqtt://mqtt.panerahackathon.com';
const INGREDIENT_PULLED = 'ingredient/pulled';
const INGREDIENT_SETUP = 'ingredient/setup';
const ORDER_RESET = 'order/reset';

const orderManager = require('./OrderManager.js');

// MQTT Client
console.log('connecing to', MQTT_URL)
const client = mqtt.connect(MQTT_URL)

client.on('connect', function () {
  console.log('connected to', MQTT_URL);
  client.subscribe(INGREDIENT_PULLED);
  client.subscribe(INGREDIENT_SETUP);
  client.subscribe(ORDER_RESET);
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  const messageStr = message.toString();
  console.log('MESSAGE received', topic, messageStr);
  if (topic === INGREDIENT_PULLED) {
    orderManager.addIngredient(JSON.parse(messageStr));
  } else if (topic === INGREDIENT_SETUP) {
    orderManager.updateIngredientToContainerMapping(JSON.parse(messageStr));
  } else if (topic === ORDER_RESET) {
    orderManager.resetOrder();
  }
})

module.exports = client;