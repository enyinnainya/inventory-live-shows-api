const { INVENTORIES_TABLE_NAME } = require('../lib/constants');
const BaseModel = require('./base');

class InventoryModel extends BaseModel {
    constructor (collection_name=null, db = null) {

        // set table/collection name
        super(collection_name || INVENTORIES_TABLE_NAME, db)
    }
}

module.exports = InventoryModel;