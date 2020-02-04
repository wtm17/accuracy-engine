const _ = require('lodash')
const LIGHTS_SIZE = 300;
const OFF = [0, 0, 0];
const ON = [255, 255, 255];

const CONTAINER_TO_LIGHTS_MAPPING = require('../data/containerToLightsMapping.json');

/**
 * Class for keeping track of the accuracy of the order.
 */
class OrderChecker {
  constructor(req, client, ingredientToContainerMapping) {
    this.referenceId = req.referenceId;
    this.ingredients = req.ingredients;
    this.addedIngredients = [];
    this.lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    this.untrackedIngredients = [];
    this.client = client;
    this.ingredientToContainerMapping = ingredientToContainerMapping;
    this.init();
  }
  /**
   * Turns on the corresponding lights for each ingredient.
   */
  init() {
    for (const ingredient of this.ingredients) {
      this.controlIngredientLights(ingredient, ON);
    }
    this.publishLightsArray();
  }
  /**
   * Turns on or off the corresponding lights for each ingredient.
   * @param {*} ingredient 
   * @param {*} value 
   */
  controlIngredientLights(ingredient, value) {
    const container = _.find(this.ingredientToContainerMapping, {
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
  /**
   * Turns off the light for the ingredient.
   * @param {*} ingredient 
   */
  addIngredient(ingredient) {
    const ingredientToAdd = {
      name: ingredient.ingredient,
    }
    this.addedIngredients.push(ingredientToAdd);
    this.controlIngredientLights(ingredientToAdd, OFF);
    this.publishLightsArray();
  }
  /**
   * Turns off all lights.
   */
  shutdown() {
    this.lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    this.publishLightsArray();
  }
  /**
   * Resets the lights and clears ingredients that have been added.
   */
  resetOrder() {
    this.addedIngredients = [];
    this.lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
    this.untrackedIngredients = [];
    this.init();
  }
  /**
   * Checks order accuracy by comparing ingredients that were added to the original build.
   */
  checkAccuracy() {
    let missingIngredients =  _.differenceBy(this.ingredients, this.addedIngredients, 'name');
    // Remove untracked ingredients
    missingIngredients = _.differenceBy(missingIngredients, this.untrackedIngredients, 'name');
    return {
      missedIngredients: missingIngredients,
      wrongIngredients: _.differenceBy(this.addedIngredients, this.ingredients, 'name'),
    };
  }
  /**
   * Publishes lights array to the client.
   */
  publishLightsArray() {
    console.log('publishing lights array');
    this.client.publish('lights/control', JSON.stringify(this.lightArray));
  }
}

module.exports = OrderChecker;