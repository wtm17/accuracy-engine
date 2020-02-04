const OrderChecker = require('./OrderChecker.js');

const INGREDIENT_TO_COTAINER_MAPPING = require('../data/ingredientToContainerMapping.json');

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
  updateIngredientToContainerMapping(ingredientToContainerMapping) {
    this.ingredientToContainerMapping = ingredientToContainerMapping;
  }
}

module.exports = new OrderManager();