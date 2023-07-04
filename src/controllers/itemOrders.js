const BaseController = require('./base');
const ItemOrdersService = require('../services/itemOrders');
const {APPLICATION_ERROR} = require('../lib/error-messages');
const {empty, isBoolean, isArray} = require('../lib/utils');

class ItemOrdersController extends BaseController {

    constructor() {
        super();
        this.itemOrdersService = new ItemOrdersService();
    }

    async placeOrder(req, res) {
        try {
            const quantity = (!empty(req) && !empty(req.body) && !empty(req.body.quantity))? req.body.quantity : null;
            const showId = (!empty(req) && !empty(req.params) && !empty(req.params.showId))? parseInt(req.params.showId) : null;
            const itemId = (!empty(req) && !empty(req.params) && !empty(req.params.itemId))? parseInt(req.params.itemId) : null;

            let post_data={
                quantity,
                showId,
                itemId
            }
            const {data, success} = await this.itemOrdersService.placeOrder(post_data);
            if (isBoolean(success) && success === true) {
                return this.sendSuccessResponse(res, (!empty(data) ? data : post_data), 201);
            }

            return this.sendFailedResponse(res, (!empty(data) ? data : APPLICATION_ERROR), (data && data.app) ? 500 : 400);
        } catch (err) {
            return this.sendFailedResponse(res, APPLICATION_ERROR,500);
        }
    }

    async getShowOrders(req, res) {
        try {
            const showId = (!empty(req) && !empty(req.params) && !empty(req.params.showId))? parseInt(req.params.showId) : null;
            const itemId = (!empty(req) && !empty(req.params) && !empty(req.params.itemId))? parseInt(req.params.itemId) : null;

            const {data, success} = await this.itemOrdersService.getShowOrders(showId, itemId);
            if (isBoolean(success) && success === true) {
                const additionalMetaData = isArray(data)?{totalRecords: !empty(data) ? data.length : 0}:null;
                return this.sendSuccessResponse(res, (!empty(data) ? data : []), 200, additionalMetaData);
            }
            return this.sendFailedResponse(res, (!empty(data) ? data : APPLICATION_ERROR),(data && data.app) ? 500 : 404);
        } catch (err) {
            return this.sendFailedResponse(res, `${APPLICATION_ERROR.app}. Ref: ${err}`,500);
        }
    }

}

module.exports = new ItemOrdersController();
