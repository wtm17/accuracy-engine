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

client.on('connect', function (err) {
  if (!err) {
    console.log('connected to', mqttUrl);
    client.subscribe('ingredient/pulled');
  } else {
    console.err(err);
  }
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
  currentOrder = new Order(req.body);
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

// Order logic
class Order {
  constructor(req) {
    this.referenceId = req.referenceId;
    this.ingredients = req.ingredients;
    this.addedIngredients = [];
    this.lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    this.untrackedIngredients = [];
  }

  generateLightsArray() {
    for (const ingredient of this.ingredients) {
      this.fillLightArray(ingredient, ON);
    }
    this.publishLightsArray();
  }

  fillLightArray(ingredient, value) {
    const container = _.find(INGREDIENT_TO_COTAINER_MAPPING, {
      ingredient: ingredient.name,
    });
    if (container) {
      const lightsRange = _.find(CONTAINER_TO_LIGHTS_MAPPING, {
        container: container.container,
      });
      if (lightsRange) {
        console.log('Turn', value === ON ? 'ON' : 'OFF', ingredient.name, 'in container', container.container, '(min:', lightsRange.min, 'max:', lightsRange.max, ')');
        _.fill(this.lightArray, value, lightsRange.min, lightsRange.max + 1);
      }
    } else {
      console.log('Could not find container for', ingredient.name);
      this.untrackedIngredients.push(ingredient);
    }
  }

  addIngredient(ingredient) {
    const ingredientToAdd = {
      name: ingredient.ingredient,
    }
    this.addedIngredients.push(ingredientToAdd);
    this.fillLightArray(ingredientToAdd, OFF);
    this.publishLightsArray();
  }

  clearLights() {
    this.lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    this.publishLightsArray();
  }

  checkAccuracy() {
    let missingIngredients =  _.differenceBy(this.ingredients, this.addedIngredients, 'name');
    // Remove untracked ingredients
    missingIngredients = _.differenceBy(missingIngredients, this.untrackedIngredients, 'name');
    return {
      missedIngredients: missingIngredients,
      wrongIngredients: _.differenceBy(this.addedIngredients, this.ingredients, 'name'),
    };
  }

  publishLightsArray() {
    console.log('lights array', this.lightArray);
    client.publish('lights/control', JSON.stringify(this.lightArray));
  }
}