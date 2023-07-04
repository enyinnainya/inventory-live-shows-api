const {describe, expect, test} = require('@jest/globals');
const supertest = require('supertest');
const app = require('../src/app');
const ItemOrderModel = require('../src/models/itemOrder');
const ShowModel = require('../src/models/show');
const InventoryModel = require('../src/models/inventory');
const itemOrderModel=new ItemOrderModel();

const request = supertest(app);
const mockData= {
    quantity: 3
}

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
let createdShowData=null;
let createdItemData=null;
let createdData=null;

beforeAll(async () => {
    await ItemOrderModel.connectDB();
});

describe('buy an inventory item during a live show test', ()=> {

    //test: Should be able to buy an inventory during a live show test
    test('Should be able to buy an inventory during a live show test', async () => {

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

        if(createdShowData && createdItemData) {
            const createOrderResponse = await request.post(`/show/${createdShowData.showId}/buy_item/${createdItemData.itemId}`);
            const responseBody = (createOrderResponse && createOrderResponse.body) ? createOrderResponse.body : null;
            expect(createOrderResponse.status).toBe(201);
            expect(responseBody).toHaveProperty('success', true);
            expect(responseBody).toHaveProperty('data');
            expect(responseBody.data).not.toBeNull();
            expect(responseBody.data).toHaveProperty('orderNumber');
            expect(responseBody.data.orderNumber).not.toBeNull();
            if (responseBody && responseBody.success && responseBody.data) {
                createdData = createOrderResponse;
            }
        }

        //delete test data
        if (createdData && createdData.id) {
            itemOrderModel.delete(createdData.id);
        }
        if (createdShowData && createdShowData.id) {
            const showModel = new ShowModel();
            showModel.delete(createdShowData.id);
        }
        if (createdItemData && createdItemData.id) {
            const inventoryModel = new InventoryModel();
            inventoryModel.delete(createdItemData.id);
        }
    });
});