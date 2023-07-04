const express = require('express');
const router = express.Router();

const inventoriesController = require('../controllers/inventories');
const showsController = require('../controllers/shows');
const itemOrdersController = require('../controllers/itemOrders');
const { RESOURCE_NOT_FOUND } = require('../lib/error-messages');

router.get('/', async (req, res) => {
   return res.status(200).send("Maka Live API!!!");
});

//Endpoint for adding one or more inventories
router.post('/inventory', async (req, res) => {
   return await inventoriesController.add(req, res);
});

//Endpoint for getting a specific inventory by itemId
router.get('/inventory/:itemId', async(req, res) => {
   return await inventoriesController.getInventory(req, res);
});

//Endpoint for getting a list of all available inventories
router.get('/inventories', async(req, res) => {
   return await inventoriesController.getInventories(req, res);
});

//Endpoint for adding one or more live shows
router.post('/show', async(req, res) => {
   return await showsController.add(req, res);
});

//Endpoint for getting a list of all available live shows
router.get('/shows', async(req, res) => {
   return await showsController.getShows(req, res);
});

//Endpoint for buying an item during a live show
router.post('/show/:showId/buy_item/:itemId', async(req, res) => {
   return await itemOrdersController.placeOrder(req, res);
});

//Endpoint for getting list of items purchased during a live show.
//Can be filtered by itemId to get list of all orders placed for an item during a live show
router.get(['/show/:showId/sold_items','/show/:showId/sold_items/:itemId'], async(req, res) => {
   return await itemOrdersController.getShowOrders(req, res);
});

//Request that doesn't match any of the above routes results in a resource not found error; Return this error to the api caller.
router.use((req, res) => {
   return inventoriesController.sendFailedResponse(res, {...RESOURCE_NOT_FOUND}, 404);
});

module.exports = router;
