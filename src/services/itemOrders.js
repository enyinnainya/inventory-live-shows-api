const BaseService = require('./base');
const InventoryModel = require('../models/inventory');
const InventoryService = require('./inventories');
const ShowModel = require('../models/show');
const ItemOrdersModel = require('../models/itemOrder');
const Joi = require('joi');
const {APPLICATION_ERROR} = require('../lib/error-messages');
const { empty, isObject, isArray, isNumber, getFormattedDate, getTimestamp, isString, reindex } = require('../lib/utils');
const BaseModel = require('../models/base');

class ShowsService extends BaseService {
    constructor() {
        super()
    }

    /**
     * Service to place order for an inventory item for a live show based on request post payload
     * @param {*} post_data
     * @returns {object}
     */
    async placeOrder(post_data = null) {
        try {

            if ((
                post_data && (!isObject(post_data) || isArray(post_data))
            )) {
                return this.sendFailedResponse({api_request: "Invalid payload provided!"});
            } else if (
                !(post_data.showId && isNumber(post_data.showId))
                || !(post_data.itemId && isNumber(post_data.itemId))
            ) {
                return this.sendFailedResponse({api_request: "Invalid request to order item. The showId and itemId are required parameters"});
            } else if (!empty(post_data.quantity) && !isNumber(post_data.quantity)) {
                return this.sendFailedResponse({api_request: "Invalid request to order item. The provided order quantity must be a number"});
            }

            // process order if no errors

            //check if show exists by the showId
            const showModel = new ShowModel();
            let existingShow = null;
            try {
                existingShow = await showModel.getRecord({showId: post_data.showId})
            } catch (err) {
            }

            if (!(existingShow && existingShow._id)) {
                return this.sendFailedResponse({message: "Invalid request to order item. No show was found for the provided showId"});
            } else if (!(isString(existingShow.showStatus) && existingShow.showStatus.trim().toUpperCase() === "ACTIVE")) {
                return this.sendFailedResponse({message: "Invalid request to order item. The requested show is no longer ACTIVE."});
            }

            //check if item exists by the itemId
            const inventoryModel = new InventoryModel();
            let existingInventoryItem = null;
            try {
                existingInventoryItem = await inventoryModel.getRecord({itemId: post_data.itemId})
            } catch (err) {
            }
            if (!(existingInventoryItem && existingInventoryItem._id)) {
                return this.sendFailedResponse({message: "Invalid request to order item. No inventory item was found for the provided itemId"});
            }

            let orderQty = 1;
            if (post_data.quantity && isNumber(post_data.quantity)) {
                orderQty = parseInt(post_data.quantity);
            }
            if (!(
                existingInventoryItem.quantity && existingInventoryItem.quantity >= orderQty
            )) {
                return this.sendFailedResponse({message: "Invalid request to order item. There is insufficient inventory to order the requested item"});
            }

            //update inventory for placed order
            let currentInventoryQty = existingInventoryItem.quantity;
            let newStockQty = currentInventoryQty - orderQty;
            newStockQty = newStockQty < 0 ? 0 : newStockQty;
            let inventoryUpdateData = {
                quantity: newStockQty
            }

            let updateResult = null;
            try {
                updateResult = await inventoryModel.update(inventoryUpdateData, ItemOrdersModel.getMongoStringId(existingInventoryItem._id));
            } catch (err) {
            }

            //place and save order
            const itemOrdersModel = new ItemOrdersModel();

            const previous_orders = await itemOrdersModel.getRecords({}, {sort: {orderNumber: -1}});
            let highest_order_number = 0;
            if (!empty(previous_orders)) {
                let order_with_highest_number = previous_orders.shift();
                if (order_with_highest_number && order_with_highest_number.orderNumber) {
                    highest_order_number = order_with_highest_number.orderNumber;
                }
            }

            highest_order_number++;
            let orderNumber = highest_order_number;

            let orderData = {
                orderNumber,
                quantity: orderQty,
                showId: post_data.showId,
                itemId: post_data.itemId,
                dateOrdered: getFormattedDate(),
                dateOrderedTimestamp: getTimestamp(),
                orderStatus: "Completed",
                orderAmount: existingInventoryItem.amount?existingInventoryItem.amount:null
            }

            let addResult = null;
            let error = "";
            try {
                addResult = await itemOrdersModel.add(orderData);
            } catch (err) {
                error = err;
            }


            if (addResult) {
                return this.sendSuccessResponse(addResult);
            } else {
                return this.sendFailedResponse({message: `We couldn't process your order at the moment, please try again. ${error ? `Ref: ${error}` : ''}`})
            }

        }catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

    /**
     * Service to get items orders for a show filtered by showId
     * If ItemId is present, returns all orders for a specific items for a specific show
     * @param {*} showId
     * @param {*} itemId
     * @returns {object}
     */
    async getShowOrders(showId = null, itemId=null) {
        try {
            let errors={};

            if(!showId){
                errors={inventory: "Please provide a showId to get show orders."}
            }

            //Get requested show orders and return data if no errors
            if(empty(errors)) {

                let showOrdersData = [];
                let showOrdersWithQtySold={};
                const itemOrdersModel = new ItemOrdersModel();
                try {
                    let searchConstraints = {showId}

                    if(itemId && isNumber(itemId)){
                        searchConstraints={
                            ...searchConstraints,
                            itemId
                        }
                    }
                    showOrdersData = await itemOrdersModel.getRecords(searchConstraints);

                    const inventoryService = new InventoryService();
                    const inventoryItemsResult = await inventoryService.listInventories();
                    let inventoryItems=null;
                    if(inventoryItemsResult && inventoryItemsResult.success && inventoryItemsResult.data){
                        inventoryItems = inventoryItemsResult.data;
                    }
                    const inventoryItemsReindexed = !empty(inventoryItems)?reindex(inventoryItems,'itemId'):{};

                    if(!empty(showOrdersData) && isArray(showOrdersData)){
                        showOrdersData = showOrdersData.map(showOrder=>{

                            if(showOrder._id) {
                                showOrder.id = BaseModel.getMongoStringId(showOrder._id);
                                try {
                                    delete showOrder._id;
                                } catch (err) {
                                    showOrder._id = null;
                                }
                            }
                            if(showOrder.itemId){
                                if(showOrdersWithQtySold[showOrder.itemId]){
                                    let quantity = 1;
                                    let quantity_sold = 1;
                                    if(showOrder.quantity){
                                        quantity = parseInt(showOrder.quantity);
                                    }
                                    if(showOrdersWithQtySold[showOrder.itemId].quantity_sold){
                                        quantity_sold = parseInt(showOrdersWithQtySold[showOrder.itemId].quantity_sold);
                                    }
                                    showOrdersWithQtySold[showOrder.itemId].quantity_sold = quantity+quantity_sold;

                                }else{

                                    showOrdersWithQtySold[showOrder.itemId] = {
                                        itemId: showOrder.itemId,
                                        itemName: (inventoryItemsReindexed[showOrder.itemId] && inventoryItemsReindexed[showOrder.itemId].itemName)?inventoryItemsReindexed[showOrder.itemId].itemName:null
                                    };
                                    let quantity = 1;
                                    if(showOrder.quantity){
                                        quantity = parseInt(showOrder.quantity);
                                    }
                                    showOrdersWithQtySold[showOrder.itemId].quantity_sold = quantity;

                                }
                            }

                            return showOrder;
                        })

                        if(!empty(showOrdersWithQtySold)){
                            showOrdersWithQtySold=Object.values(showOrdersWithQtySold);
                            if(itemId && isNumber(itemId)){
                                showOrdersWithQtySold=showOrdersWithQtySold.shift();
                            }
                        }

                    }
                } catch (err) {
                    throw new Error(APPLICATION_ERROR.app)
                }

                return this.sendSuccessResponse(showOrdersWithQtySold);
            }
            return this.sendFailedResponse(errors);
        } catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

}

module.exports = ShowsService;
