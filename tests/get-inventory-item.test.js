const {describe, expect, test} = require('@jest/globals');
const supertest = require('supertest');
const app = require('../src/app');
const InventoryModel = require('../src/models/inventory');
const {isArray} = require("../src/lib/utils")
const inventoryModel=new InventoryModel();

const request = supertest(app);
const mockData= [
    {
        "itemId":1111110,
        "itemName": "Wrist Watch Test",
        "quantity":13,
        "amount": 250.45
    }
]
let createdData=null;
beforeAll(async () => {
    await InventoryModel.connectDB();
});

describe('Get an inventory item by itemId test', ()=> {

    //test: Should be able to save an inventory item with well-formed data to the system
    test('Should be able to get an existing inventory item by itemId', async () => {
        const createResponse = await request.post('/inventory').send(mockData);
        const createResponseBody = (createResponse && createResponse.body) ? createResponse.body : null;
        if (createResponseBody && createResponseBody.success && createResponseBody.data && createResponseBody.data[0] && createResponseBody.data[0].success && createResponseBody.data[0].data && createResponseBody.data[0].data.itemId) {
            createdData = createResponseBody.data[0].data;
            const response = await request.get(`/inventory/${createdData.itemId}`);
            const responseBody = (response && response.body) ? response.body : null;
            expect(response.status).toBe(200);
            expect(responseBody).toHaveProperty('success', true);
            expect(responseBody).toHaveProperty('data');
            expect(responseBody.data).not.toBeNull();
            expect(responseBody.data).toHaveProperty('id');
            expect(responseBody.data.id).not.toBe('');
        }
    });

    /** test: Should be able return a user-friendly message if no inventory found
     * based on provided ID value
     */
    test('Should be able return a user-friendly message if no inventory found based on supplied ID', async () => {
        const response = await request.get('/inventory/111b6742d6676e356218155a');
        const responseBody = (response && response.body) ? response.body : null;
        expect(response.status).toBe(400);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('inventory');
        expect(responseBody.errors.inventory).not.toBe('');

    })

    /** test: Should be able to handle unexpected internal system/server error
     * and present user with user-friendly feedback message
     */
    test('Should be able to handle unexpected internal system error when fetching a inventory', async () => {
        if (createdData && createdData.id) {
            inventoryModel.delete(createdData.id);
        }
        await InventoryModel.closeDBConnection();
        const response = await request.get("/inventory/111b6742d6676e356218155a");
        const responseBody = (response && response.body) ? response.body : null;

        expect(response.status).toBe(500);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('app');
        expect(responseBody.errors.app).not.toBe('');
    })
});