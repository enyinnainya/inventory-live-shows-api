const {describe, expect, test} = require('@jest/globals');
const supertest = require('supertest');
const app = require('../src/app');
const InventoryModel = require('../src/models/inventory');
const {isArray} = require("../src/lib/utils")
const inventoryModel=new InventoryModel();

const request = supertest(app);
const mockData= [
    {
        "itemId":111111,
        "itemName": "Wrist Watch Test",
        "quantity":13,
        "amount": 250.45
    },
    {
        "itemId":222222,
        "itemName": "Hoodies Test",
        "quantity":12,
        "amount": 1234.65
    }
]
const failedValidationMockData = [
    {
        "itemId":"dummy",
        "itemName": "",
        "quantity":13,
        "amount": 250.45
    }
]
let createdData=null;

beforeAll(async () => {
    await InventoryModel.connectDB();
});

describe('Create/Update an inventory item test', ()=> {

    //test: Should be able to save an inventory item with well-formed data to the system
    test('Should be able to save an inventory item with well-formed data', async () => {
        const response = await request.post('/inventory').send(mockData);
        const responseBody = (response && response.body) ? response.body : null;
        expect(response.status).toBe(201);
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody).toHaveProperty('data');
        expect(responseBody.data).not.toBeNull();
        expect(responseBody.data[0]).not.toBeNull();
        expect(responseBody.data[0]).toHaveProperty('success');
        expect(responseBody.data[0]).toHaveProperty('data');
        expect(responseBody.data[0].data).not.toBeNull();
        expect(responseBody.data[0].data).toHaveProperty('itemId');
        if (responseBody && responseBody.success && responseBody.data) {
            createdData = responseBody.data;
        }
    });

    /** test: Should be able to validate post data for required and well-formed data
     * and return failed response if not pass validation
     */
    test('Should be able validate post data for required and well-formed data and return errors if failed', async () => {
        const response = await request.post('/inventory').send(failedValidationMockData);
        const responseBody = (response && response.body) ? response.body : null;
        expect(response.status).toBe(400);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('itemId_0');
        expect(responseBody.errors.itemId_0).not.toBe('');
    });

    /** test: Should be able to handle unexpected internal system/server error
     * and present user with user-friendly feedback message
     */
    test('Should be able to handle unexpected internal system error when creating an inventory item', async () => {
        if (createdData && isArray(createdData)) {
            createdData.forEach((createdDataItem, index)=>{
                if(createdDataItem && createdDataItem.success && createdDataItem.data && createdDataItem.data.id){
                    inventoryModel.delete(createdDataItem.data.id);
                }
            })
        }

        await InventoryModel.closeDBConnection();
        const response = await request.post('/inventory').send(mockData)

        const responseBody = (response && response.body) ? response.body : null;

        expect(response.status).toBe(500);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody).toHaveProperty('server_error');
        expect(responseBody.server_error).not.toBe('');
    });
});