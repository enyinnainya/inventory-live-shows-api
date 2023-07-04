const BaseService = require('./base');
const InventoryModel = require('../models/inventory');
const Joi = require('joi');
const {APPLICATION_ERROR, INVENTORY_NOT_FOUND} = require('../lib/error-messages');
const { empty, isObject, isArray } = require('../lib/utils');
const BaseModel = require('../models/base');

class InventoriesService extends BaseService {
    constructor() {
        super()
    }

    /**
     * Service to create inventories based on request post payload
     * @param {*} post_data
     * @returns {object}
     */
    async addUpdate(post_data = null) {
        try {

            if(!(
                post_data && isArray(post_data)
            )){
                return this.sendFailedResponse({api_request: "Invalid payload provided!"});
            }

            //Defining validation schema for post payload
            const schema = Joi.array().items(Joi.object().keys({
                    itemId: Joi.number()
                        .required()
                        .strict(true)
                        .label("Item ID"),

                    quantity: Joi.number()
                        .required()
                        .strict(true)
                        .label("Item Quantity"),
                    amount: Joi.number()
                        .required()
                        .precision(2)
                        .strict(true)
                        .label("Item Amount"),
                    itemName: Joi.string()
                        .pattern(/^[A-Za-z \-0-9]+$/)
                        .required()
                        .label("Item Name")
                })).min(1)
                    .label("Payload")

            let errors = await this.validateJoiPost(schema, post_data);

            let returnData = [];

            // check for errors and create inventory if no errors
            if (empty(errors)) {

                let atleast_one_error_occurred=false;
                const inventoryModel = new InventoryModel();
                for(let counter=0;counter<post_data.length;counter++){
                    const currentItem = post_data[counter]?post_data[counter]:null;
                    let error = null;
                    if(currentItem && currentItem.itemId) {

                        let existingInventory=null;
                        try{
                            existingInventory =  await inventoryModel.getRecord({itemId: currentItem.itemId})
                        }catch (err){}

                        let add_update_inventory_data = {
                            itemName: currentItem.itemName,
                            quantity: currentItem.quantity,
                            amount: currentItem.amount,
                        };

                        //check if item already exists and update record or add new
                        if(existingInventory && existingInventory._id){
                            //saving inventory data to DB
                            let updateResult = null;
                            try{
                                updateResult = await inventoryModel.update(add_update_inventory_data, InventoryModel.getMongoStringId(existingInventory._id));
                            }catch(err){
                                error = err;
                                atleast_one_error_occurred=true;
                            }

                            if(!empty(updateResult)){
                                let returnUpdateResult = {
                                    ...existingInventory,
                                    ...updateResult
                                }

                                try {
                                    delete returnUpdateResult._id;
                                } catch (err) {
                                    returnUpdateResult._id = null;
                                }

                                returnData=[
                                    ...returnData,
                                    {
                                        itemId: currentItem.itemId,
                                        success: true,
                                        data: returnUpdateResult
                                    }
                                ]
                            }else{
                                returnData=[
                                    ...returnData,
                                    {
                                        itemId: currentItem.itemId,
                                        success: false,
                                        error: `We couldn't process your request at the moment, please try again. ${error?`Ref: ${error}`:''}`
                                    }
                                ]
                            }
                        }else{

                            //itemID does not exist. Go ahead and create new inventory
                            add_update_inventory_data.itemId = currentItem.itemId;

                            let addResult=null;
                            try {
                                addResult = await inventoryModel.add(add_update_inventory_data);
                            } catch (err) {
                                error = err;
                                atleast_one_error_occurred=true;
                            }

                            if(addResult){
                                returnData=[
                                    ...returnData,
                                    {
                                        itemId: currentItem.itemId,
                                        success: true,
                                        data: addResult
                                    }
                                ]
                            }else{
                                returnData=[
                                    ...returnData,
                                    {
                                        itemId: currentItem.itemId,
                                        success: false,
                                        error: `We couldn't process your request at the moment, please try again. ${error?`Ref: ${error}`:''}`
                                    }
                                ]
                            }
                        }
                    }
                }

                if(atleast_one_error_occurred){
                    return this.sendFailedResponse(returnData, true);
                }else{
                    return this.sendSuccessResponse(returnData);
                }

            }
            return this.sendFailedResponse(errors);
        } catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

    /**
     * Service to list all inventories
     * @param {*} search_constraints
     * @returns {object}
     */
    async listInventories(search_constraints = {}) {
        try {
            search_constraints = (search_constraints && isObject(search_constraints)) ? search_constraints : {};

            //getting list of inventories and return retrieved records if no errors
            let inventoriesData = [];
            const inventoryModel = new InventoryModel();
            try {
                inventoriesData = await inventoryModel.getRecords(search_constraints);
                if(!empty(inventoriesData) && isArray(inventoriesData)){
                    inventoriesData = inventoriesData.map(inventory=>{
                        if(inventory._id) {
                            inventory.id = BaseModel.getMongoStringId(inventory._id);
                            try {
                                delete inventory._id;
                            } catch (err) {
                                inventory._id = null;
                            }
                        }
                        return inventory;
                    })
                }
            } catch (err) {
                throw new Error (APPLICATION_ERROR.app)
            }
            return this.sendSuccessResponse(inventoriesData);
        } catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

    /**
     * Service to get a specific inventory by itemID
     * @param {*} itemId
     * @returns {object}
     */
    async getInventory(itemId = null) {
        try {
            let errors={};

            if(!itemId){
                errors={inventory: "Please provide an itemID to get an inventory. "}
            }

            //Get requested inventory and return data if no errors
            if(empty(errors)) {
                let inventoryData = null;
                const inventoryModel = new InventoryModel();
                try {
                    itemId=parseInt(itemId);
                    inventoryData = await inventoryModel.getRecord({itemId});
                    if (!empty(inventoryData) && isObject(inventoryData) && inventoryData._id) {
                        inventoryData.id = BaseModel.getMongoStringId(inventoryData._id);
                        try {
                            delete inventoryData._id;
                        } catch (err) {
                            inventoryData._id = null;
                        }
                    }
                } catch (err) {
                    throw new Error(APPLICATION_ERROR.app)
                }
                if (!empty(inventoryData)) {
                    return this.sendSuccessResponse(inventoryData);
                }
                return this.sendFailedResponse(INVENTORY_NOT_FOUND);
            }
            return this.sendFailedResponse(errors);
        } catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

}

module.exports = InventoriesService;
