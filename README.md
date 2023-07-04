
# Inventory & Live Shows API
This is a REST API for managing inventories, live shows, buying items during live shows, getting sold items during live shows, etc.
The app uses MongoDB cloud-hosted database for persisting data in the system.

## Author
This API was engineered by Enyinna Inya
- [@enyinnainya](https://github.com/enyinnainya)


## Installation and Usage
To install and deploy this API, clone the project and run the following in the project root directory:

```bash
  npm install
```
This will install all the project required dependencies

```bash
  npm start
```
This will start the app server at http://127.0.0.1:3001 (on port 3001)

```bash
  npm test
```
This will run all tests cases to make sure the API and its endpoints are working correctly as expected and will highlight any failed tests. This app utilized TDD approach.

To consume the Api endpoints, you can use Postman or any other REST API testing client tool to make the api requests for each endpoint.


## Technologies Used
The following technologies were used to build this app.
- NodeJS
- Express
- MongoDB
- Jest Testing Framework
- Supertest (used together with Jest for Testing)

