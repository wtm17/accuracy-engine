var mqtt = require('mqtt')
const express = require('express')
const cors = require('cors')
const port = 3006;
const mqttUrl = 'mqtt://mqtt.panerahackathon.com';
const bodyParser = require('body-parser');
const OrderChecker = require('./OrderChecker.js');

let currentOrder;

// MQTT Client
console.log('connecing to', mqttUrl)
const client = mqtt.connect(mqttUrl)

client.on('connect', function () {
  console.log('connected to', mqttUrl);
  client.subscribe('ingredient/pulled');
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  if (topic === 'ingredient/pulled') {
    if (currentOrder) {
      currentOrder.addIngredient(JSON.parse(message.toString()));
    }
  }
  //client.end()
})

// Express App
const app = express();
app.use(cors({
  allowedHeaders: [
    "Origin",
    "X-Request-With",
    "Content-Type",
    "Accept",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "X-Origin-Source",
    "Accept-Language",
    "X-Access-Token",
    "X-Registration-Source"
  ],
  "credentials": true,
  "methods": "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
  "origin": "*",
  "preflightContinue": false
}));
app.use(bodyParser.json());
app.get('/', (req, res) => res.json({success: true}))
app.post('/order/start', (req, res) => {
  console.log('start body', req.body);
  currentOrder = new OrderChecker(req.body, client);
  currentOrder.generateLightsArray();
  res.json({success: true})
})
app.post('/ingredient/add', (req, res) => {
  console.log('ingredient add body', req.body);
  if (currentOrder) {
    currentOrder.addIngredient(req.body);
  }
  res.json({success: true})
})
app.post('/order/finish', (req, res) => {
  console.log('finish body', req.body);
  if (currentOrder) {
    currentOrder.clearLights();
  }
  res.json(currentOrder.checkAccuracy())
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))