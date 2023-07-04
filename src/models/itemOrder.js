const { LIVE_SHOWS_ORDERS_TABLE_NAME } = require('../lib/constants');
const BaseModel = require('./base');

class ItemOrderModel extends BaseModel {
    constructor (collection_name=null, db = null) {

        // set table/collection name
        super(collection_name || LIVE_SHOWS_ORDERS_TABLE_NAME, db)
    }
}

module.exports = ItemOrderModel;