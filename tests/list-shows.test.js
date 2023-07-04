const {describe, expect, test} = require('@jest/globals');
const supertest = require('supertest');
const app = require('../src/app');
const ShowModel = require('../src/models/show');
const {isArray} = require("../src/lib/utils")
const showModel=new ShowModel();

const request = supertest(app);
const mockData= [
    {
        "showId":100000000,
        "showName": "Live Auction Sales Test",
        "showStatus":"Active",
        "showDate":"06/08/2024"
    },
    {
        "showId":200000000,
        "showName": "Mid-Year Sales Test",
        "showDate":"07/14/2023",
        "showStatus":"Active"
    },
    {
        "showId":3000000,
        "showName": "Summer Hangout Test",
        "showDate":"09/19/2023",
        "showStatus":"Active"
    }
]
let createdData=null;
beforeAll(async () => {
    await ShowModel.connectDB();
});

describe('List all existing live shows test', ()=> {

    /** test: Should be able to list all the existing live shows in the system
     * and return fetched data to client
     */
    test('Should be able to list all existing live shows', async () => {
        const createResponse = await request.post('/show').send(mockData);
        const createResponseBody = (createResponse && createResponse.body) ? createResponse.body : null;
        if (createResponseBody && createResponseBody.success && createResponseBody.data && createResponseBody.data[0]) {
            createdData = createResponseBody.data;
            const response = await request.get('/shows');
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

    /** test: Should be able to handle unexpected internal system error when fetching live shows
    * and present user with user-friendly feedback message
     **/
    test('Should be able to handle unexpected internal system error when fetching live shows', async () => {
        if (createdData && createdData.id) {
            showModel.delete(createdData.id);
        }
        await ShowModel.closeDBConnection();
        const response = await request.get("/shows");
        const responseBody = (response && response.body) ? response.body : null;

        expect(response.status).toBe(500);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('app');
        expect(responseBody.errors.app).not.toBe('');
    })
});