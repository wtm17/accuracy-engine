const OrderChecker = require('./OrderChecker.js');
const _ = require('lodash')

const INGREDIENT_TO_COTAINER_MAPPING = require('../data/ingredientToContainerMapping.json');
const CONTAINER_TO_LIGHTS_MAPPING = require('../data/containerToLightsMapping.json');

const LIGHTS_SIZE = 288;
const OFF = [0, 0, 0];
const ON = [255, 255, 255];

/**
 * Class for keeping track of the current order being tracked.
 */
class OrderManager {
  constructor() {
    this.currentOrder = undefined;
    this.ingredientToContainerMapping = INGREDIENT_TO_COTAINER_MAPPING;
  }
  startOrder(req, client) {
    this.currentOrder = new OrderChecker(req, client, this.ingredientToContainerMapping);
  }
  addIngredient(ingredient) {
    if (this.currentOrder) {
      this.currentOrder.addIngredient(ingredient);
    }
  }
  finishOrder() {
    if (this.currentOrder) {
      this.currentOrder.shutdown();
      const response = this.currentOrder.checkAccuracy();
      this.currentOrder = undefined;
      return response;
    } else {
      return {message: 'no order in progress'};
    }
  }
  resetOrder() {
    if (this.currentOrder) {
      this.currentOrder.resetOrder();
    } else {
      return {message: 'no order in progress'};
    }
  }
  updateIngredientToContainerMapping(ingredientToContainerMapping) {
    this.ingredientToContainerMapping = ingredientToContainerMapping;
  }
  /**
   * Tests all containers in sequence
   */
  testAllContainers(client) {
    for (const container of _.sortBy(CONTAINER_TO_LIGHTS_MAPPING, 'lightPos')) {
      setTimeout(() => {
        let lightArray = _.fill(Array(LIGHTS_SIZE), OFF);
        _.fill(lightArray, ON, container.min, container.max + 1);
        client.publish('lights/control', JSON.stringify(lightArray));
      }, 1000 * (container.lightPos - 1));
    }
    setTimeout(() => {
      client.publish('lights/control', JSON.stringify(_.fill(Array(LIGHTS_SIZE), OFF)));
    }, 1000 * CONTAINER_TO_LIGHTS_MAPPING.length);
  }
}

module.exports = new OrderManager();