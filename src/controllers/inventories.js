const BaseController = require('./base');
const InventoryService = require('../services/inventories');
const {APPLICATION_ERROR} = require('../lib/error-messages');
const {empty, isBoolean, isArray} = require('../lib/utils');

class InventoriesController extends BaseController {

   constructor() {
      super();
      this.inventoryService = new InventoryService();
   }


   async add(req, res) {
      try {
         const post_data = (!empty(req) && !empty(req.body)) ? req.body : [];
         const {data, success, server_error} = await this.inventoryService.addUpdate(post_data);
         if (isBoolean(success) && success === true) {
            return this.sendSuccessResponse(res, (!empty(data) ? data : post_data), 201);
         }

         return this.sendFailedResponse(res, (!empty(data) ? data : APPLICATION_ERROR), (isBoolean(server_error) && server_error) ? 500 : 400, {server_error: APPLICATION_ERROR.app});
      } catch (err) {
         return this.sendFailedResponse(res, APPLICATION_ERROR,500);
      }
   }

   async getInventories(req, res) {
      try {

         const search_constraints = (!empty(req) && !empty(req.body)) ? req.body : {};
         const {data, success} = await this.inventoryService.listInventories(search_constraints);
         if (isBoolean(success) && success === true) {
            const additionalMetaData = {totalRecords: (!empty(data) && isArray(data)) ? data.length : 0}
            return this.sendSuccessResponse(res, (!empty(data) ? data : []), 200, additionalMetaData);
         }
         return this.sendFailedResponse(res, (!empty(data) ? data : APPLICATION_ERROR),(data && data.app) ? 500 : 404);
      } catch (err) {
         return this.sendFailedResponse(res, `${APPLICATION_ERROR.app}. Ref: ${err}`,500);
      }
   }


   async getInventory(req, res) {
      try {
         const itemId = (!empty(req) && !empty(req.params) && !empty(req.params.itemId))? req.params.itemId : null;
         const { data, success } = await this.inventoryService.getInventory(itemId);
         if (isBoolean(success) && success === true) {
            return this.sendSuccessResponse(res, (!empty(data)?data:null), 200);
         }
         return this.sendFailedResponse(res, (!empty(data)?data:APPLICATION_ERROR), (data && data.app) ? 500 : 400);
      } catch (err) {
         return this.sendFailedResponse(res, APPLICATION_ERROR, 500);
      }
   }
}

module.exports = new InventoriesController();
