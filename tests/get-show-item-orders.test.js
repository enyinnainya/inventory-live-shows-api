const {describe, expect, test} = require('@jest/globals');
const supertest = require('supertest');
const app = require('../src/app');
const ItemOrderModel = require('../src/models/itemOrder');
const ShowModel = require('../src/models/show');
const InventoryModel = require('../src/models/inventory');
const {isArray} = require("../src/lib/utils")
const itemOrderModel=new ItemOrderModel();

const request = supertest(app);
const itemMockData= [
    {
        "itemId":1111110,
        "itemName": "Wrist Watch Test",
        "quantity":13,
        "amount": 250.45
    }
]

const showMockData= [
    {
        "showId":1010001,
        "showName": "Live Auction Sales Test",
        "showStatus":"Active",
        "showDate":"06/08/2023"
    },
]
let createdOrderData=null;
let createdShowData=null;
let createdItemData=null;

beforeAll(async () => {
    await ItemOrderModel.connectDB();
});

describe('Get show/item orders by showId and itemId', ()=> {

    //test: Should be able to get list of orders for a show and items by showId and itemId
    test('Should be able to get list of orders for a show for items by showId and itemId', async () => {

        //create show
        const showResponse = await request.post('/show').send(showMockData);
        const showResponseBody = (showResponse && showResponse.body) ? showResponse.body : null;

        if (showResponseBody && showResponseBody.success && showResponseBody.data && showResponseBody.data[0] && showResponseBody.data[0].success && showResponseBody.data[0].data && showResponseBody.data[0].data.showId) {
            createdShowData = showResponseBody.data[0].data;
        }

        //create item
        const itemResponse = await request.post('/inventory').send(itemMockData);
        const itemResponseBody = (itemResponse && itemResponse.body) ? itemResponse.body : null;

        if (itemResponseBody && itemResponseBody.success && itemResponseBody.data && itemResponseBody.data[0] && itemResponseBody.data[0].success && itemResponseBody.data[0].data && itemResponseBody.data[0].data.itemId) {
            createdItemData = itemResponseBody.data[0].data;
        }

        if(createdShowData && createdItemData){
            const createOrderResponse = await request.post(`/show/${createdShowData.showId}/buy_item/${createdItemData.itemId}`);
            const createOrderResponseBody = (createOrderResponse && createOrderResponse.body) ? createOrderResponse.body : null;
            if (createOrderResponseBody && createOrderResponseBody.success && createOrderResponseBody.data && createOrderResponseBody.data.orderNumber) {
                createdOrderData = createOrderResponseBody.data;
                const getOrdersResponse = await request.get(`/show/${createdShowData.showId}/sold_items/${createdItemData.itemId}`);
                const getOrdersResponseBody = (getOrdersResponse && getOrdersResponse.body) ? getOrdersResponse.body : null;

                expect(getOrdersResponse.status).toBe(200);
                expect(getOrdersResponseBody).toHaveProperty('success', true);
                expect(getOrdersResponseBody).toHaveProperty('data');
                expect(getOrdersResponseBody.data).not.toBeNull();
                expect(getOrdersResponseBody.data).not.toBeNull();
                expect(getOrdersResponseBody.data).toHaveProperty('itemId');
                expect(getOrdersResponseBody.data.itemId).not.toBe('');
            }
        }

    });

    /** test: Should be able to handle unexpected internal system/server error
     * and present user with user-friendly feedback message
     */
    test('Should be able to handle unexpected internal system error when fetching a inventory', async () => {
        if (createdOrderData && createdOrderData.id) {
            itemOrderModel.delete(createdOrderData.id);
        }
        if (createdShowData && createdShowData.id) {
            const showModel = new ShowModel();
            showModel.delete(createdShowData.id);
        }
        if (createdItemData && createdItemData.id) {
            const inventoryModel = new InventoryModel();
            inventoryModel.delete(createdItemData.id);
        }
        await ItemOrderModel.closeDBConnection();
        const response = await request.get(`/show/${createdShowData.showId}/sold_items/${createdItemData.itemId}`);
        const responseBody = (response && response.body) ? response.body : null;

        expect(response.status).toBe(500);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('app');
        expect(responseBody.errors.app).not.toBe('');
    })
});