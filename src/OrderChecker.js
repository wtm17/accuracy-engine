const _ = require('lodash')
const LIGHTS_SIZE = 300;
const OFF = [0, 0, 0];
const ON = [255, 255, 255];

const CONTAINER_TO_LIGHTS_MAPPING = require('../data/containerToLightsMapping.json');
const INGREDIENT_TO_COTAINER_MAPPING = require('../data/ingredientToContainerMapping.json');

class OrderChecker {
  constructor(req, client) {
    this.referenceId = req.referenceId;
    this.ingredients = req.ingredients;
    this.addedIngredients = [];
    this.lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    this.untrackedIngredients = [];
    this.client = client;
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
    this.client.publish('lights/control', JSON.stringify(this.lightArray));
  }
}

module.exports = OrderChecker;