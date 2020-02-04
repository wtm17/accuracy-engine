const express = require('express')
const cors = require('cors')
const corsConfig = require('../data/corsConfig.json');
const port = 3006;
const bodyParser = require('body-parser');
const orderManager = require('./OrderManager.js');
const client = require('./client.js');

// Express App
const app = express();
app.use(cors(corsConfig));
app.use(bodyParser.json());

/**
 * Endpoint to start order.
 */
app.post('/order/start', (req, res) => {
  console.log('start body', req.body);
  orderManager.startOrder(req.body, client);
  res.json({success: true})
})
/**
 * Endpoint to add ingredient
 */
app.post('/ingredient/add', (req, res) => {
  console.log('ingredient add body', req.body);
  orderManager.addIngredient(req.body);
  res.json({success: true})
})
/**
 * Endpoint to setup ingredients
 */
app.post('/ingredient/setup', (req, res) => {
  console.log('ingredient setup body', req.body);
  orderManager.updateIngredientToContainerMapping(req.body);
  res.json({success: true})
})
/**
 * Endpoint to finish order.
 */
app.post('/order/finish', (req, res) => {
  console.log('finish body', req.body);
  res.json(orderManager.finishOrder());
})
/**
 * Endpoint to finish order.
 */
app.post('/order/reset', (req, res) => {
  console.log('reset body', req.body);
  orderManager.resetOrder();
  res.json({success: true});
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))