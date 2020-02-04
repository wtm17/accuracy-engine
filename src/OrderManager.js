const OrderChecker = require('./OrderChecker.js');

/**
 * Class for keeping track of the current order being tracked.
 */
class OrderManager {
  constructor() {
    this.currentOrder = undefined;
  }
  startOrder(req, client) {
    this.currentOrder = new OrderChecker(req, client);
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
}

module.exports = new OrderManager();