const {describe, expect, test} = require('@jest/globals');
const supertest = require('supertest');
const app = require('../src/app');
const ShowModel = require('../src/models/show');
const {isArray} = require("../src/lib/utils")
const showModel=new ShowModel();

const request = supertest(app);
const mockData= [
    {
        "showId":101000,
        "showName": "Live Auction Sales Test",
        "showStatus":"Active",
        "showDate":"06/08/2023"
    },
    {
        "showId":200002,
        "showName": "Mid-Year Sales Test",
        "showDate":"03/14/2023",
        "showStatus":"Active"
    },
    {
        "showId":3000000,
        "showName": "End of Year Sales Test",
        "showDate":"06/05/2023",
        "showStatus":"Active"
    }
]
const failedValidationMockData = [
    {
        "showId":"dummy5",
        "showName": "",
        "showDate":"09/19/2023",
        "showStatus":"Active"
    }
]
let createdData=null;

beforeAll(async () => {
    await ShowModel.connectDB();
});

describe('Create/Update a live show test', ()=> {

    //test: Should be able to save a live show with well-formed data to the system
    test('Should be able to save a live show with well-formed data', async () => {
        const response = await request.post('/show').send(mockData);
        const responseBody = (response && response.body) ? response.body : null;
        expect(response.status).toBe(201);
        expect(responseBody).toHaveProperty('success', true);
        expect(responseBody).toHaveProperty('data');
        expect(responseBody.data).not.toBeNull();
        expect(responseBody.data[0]).not.toBeNull();
        expect(responseBody.data[0]).toHaveProperty('success');
        expect(responseBody.data[0]).toHaveProperty('data');
        expect(responseBody.data[0].data).not.toBeNull();
        expect(responseBody.data[0].data).toHaveProperty('showId');
        if (responseBody && responseBody.success && responseBody.data) {
            createdData = responseBody.data;
        }
    });

    /** test: Should be able to validate post data for required and well-formed data
     * and return failed response if not pass validation
     */
    test('Should be able validate post data for required and well-formed data and return errors if failed', async () => {
        const response = await request.post('/show').send(failedValidationMockData);
        const responseBody = (response && response.body) ? response.body : null;
        expect(response.status).toBe(400);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody.errors).toHaveProperty('showId_0');
        expect(responseBody.errors.showId_0).not.toBe('');
    });

    /** test: Should be able to handle unexpected internal system/server error
     * and present user with user-friendly feedback message
     */
    test('Should be able to handle unexpected internal system error when creating a live show', async () => {
        if (createdData && isArray(createdData)) {
            createdData.forEach((createdDataItem, index)=>{
                if(createdDataItem && createdDataItem.success && createdDataItem.data && createdDataItem.data.id){
                    showModel.delete(createdDataItem.data.id);
                }
            })
        }

        await ShowModel.closeDBConnection();
        const response = await request.post('/show').send(mockData)

        const responseBody = (response && response.body) ? response.body : null;

        expect(response.status).toBe(500);
        expect(responseBody).toHaveProperty('success', false);
        expect(responseBody).toHaveProperty('errors');
        expect(responseBody.errors).not.toBeNull();
        expect(responseBody).toHaveProperty('server_error');
        expect(responseBody.server_error).not.toBe('');
    });
});