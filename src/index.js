var mqtt = require('mqtt')
const express = require('express')
const _ = require('lodash')
const cors = require('cors')
const port = 3006;
const mqttUrl = 'mqtt://mqtt.panerahackathon.com';
const bodyParser = require('body-parser');
const LIGHTS_SIZE = 300;
const OFF = [0, 0, 0];
const ON = [255, 255, 255];

const CONTAINER_TO_LIGHTS_MAPPING = require('../data/containerToLightsMapping.json');
const INGREDIENT_TO_COTAINER_MAPPING = require('../data/ingredientToContainerMapping.json');

let currentOrder;

// MQTT Client
console.log('connecing to', mqttUrl)
const client = mqtt.connect(mqttUrl)

client.on('connect', function () {
  console.log('connected to', mqttUrl);
  client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'hello mqqt')
    } else {
      console.error(err);
    }
  })
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
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
  currentOrder = new Order(req.body);
  currentOrder.generateLightsArray();
  res.json({success: true})
})
app.post('/order/finish', (req, res) => {
  console.log('finish body', req.body);
  currentOrder.clearLights();
  res.json({success: true})
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// Order logic
class Order {
  constructor(req) {
    this.referenceId = req.referenceId;
    this.ingredients = req.ingredients;
  }

  generateLightsArray() {
    const lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    for (const ingredient of this.ingredients) {
      const container = _.find(INGREDIENT_TO_COTAINER_MAPPING, {
        ingredient: ingredient.name,
      });
      if (container) {
        console.log('Found', ingredient.name, 'in container', container.container);
        const lightsRange = _.find(CONTAINER_TO_LIGHTS_MAPPING, {
          container: container.container,
        });
        if (lightsRange) {
          console.log('Container', container.container, 'is marked by lights', lightsRange.min, '-', lightsRange.max);
          _.fill(lightArray, ON, lightsRange.min, lightsRange.max + 1);
        }
      } else {
        console.log('Could not find container for', ingredient.name);
      }
    }
    console.log('lights array', lightArray);
    this.publishLightsArray(lightArray);
  }

  clearLights() {
    const lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    console.log('lights array', lightArray);
    this.publishLightsArray(lightArray);
  }

  publishLightsArray(arr) {
    client.publish('lights/control', JSON.stringify(arr));
  }
}