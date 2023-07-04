const BaseController = require('./base');
const ShowService = require('../services/shows');
const {APPLICATION_ERROR} = require('../lib/error-messages');
const {empty, isBoolean, isArray} = require('../lib/utils');

class ShowsController extends BaseController {

    constructor() {
        super();
        this.showService = new ShowService();
    }


    async add(req, res) {
        try {
            const post_data = (!empty(req) && !empty(req.body)) ? req.body : [];
            const {data, success, server_error} = await this.showService.addUpdate(post_data);
            if (isBoolean(success) && success === true) {
                return this.sendSuccessResponse(res, (!empty(data) ? data : post_data), 201);
            }

            return this.sendFailedResponse(res, (!empty(data) ? data : APPLICATION_ERROR), (isBoolean(server_error) && server_error) ? 500 : 400, {server_error: APPLICATION_ERROR.app});
        } catch (err) {
            return this.sendFailedResponse(res, APPLICATION_ERROR,500);
        }
    }

    async getShows(req, res) {
        try {

            const {data, success} = await this.showService.listShows({});
            if (isBoolean(success) && success === true) {
                const additionalMetaData = {totalRecords: (!empty(data) && isArray(data)) ? data.length : 0}
                return this.sendSuccessResponse(res, (!empty(data) ? data : []), 200, additionalMetaData);
            }
            return this.sendFailedResponse(res, (!empty(data) ? data : APPLICATION_ERROR),(data && data.app) ? 500 : 404);
        } catch (err) {
            return this.sendFailedResponse(res, `${APPLICATION_ERROR.app}. Ref: ${err}`,500);
        }
    }

}

module.exports = new ShowsController();
