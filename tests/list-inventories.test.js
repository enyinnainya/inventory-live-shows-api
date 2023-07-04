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
let createdData=null;
beforeAll(async () => {
    await InventoryModel.connectDB();
});

describe('List all existing inventories test', ()=> {

    /** test: Should be able to list all the existing inventories in the system
     * and return fetched data to client
     */
    test('Should be able to list all existing inventories', async () => {
        const createResponse = await request.post('/inventory').send(mockData);
        const createResponseBody = (createResponse && createResponse.body) ? createResponse.body : null;
        if (createResponseBody && createResponseBody.success && createResponseBody.data && createResponseBody.data[0]) {
            createdData = createResponseBody.data;
            const response = await request.get('/inventories');
            const responseBody = (response && response.body) ? response.body : null;
            expect(response.status).toBe(200);
            expect(responseBody).toHaveProperty('success', true);
            expect(responseBody).toHaveProperty('data');
            expect(responseBody.data).not.toBeNull();
            expect(responseBody.data[0]).not.toBeNull();
            expect(responseBody.data[0]).toHaveProperty('id');
            expect(responseBody.data[0].id).not.toBe('');
        }
    });

    /** test: Should be able to handle unexpected internal system error when fetching inventories
    * and present user with user-friendly feedback message
     **/
    test('Should be able to handle unexpected internal system error when fetching inventories', async () => {
        if (createdData && createdData.id) {
            inventoryModel.delete(createdData.id);
        }
        await InventoryModel.closeDBConnection();
        const response = await request.get("/inventories");
        const responseBody = (response && response.body) ? response.body : null;

        expect(response.status).toBe(500);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('app');
        expect(responseBody.errors.app).not.toBe('');
    })
});