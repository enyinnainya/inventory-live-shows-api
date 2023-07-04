
const { empty, isObject, isString, isArray, isBoolean } = require('../lib/utils');

/**
 * set up base functionality for inherited subclasses
 * Class BaseService
 */
class BaseService {
    static collection_name = '';
    static database_name = '';
    static object_class = '';
    static object_class_arguments = [];

    /**
     * uniform expectation of failed response data
     * @param data
     * @return {object}
     */
    sendFailedResponse(data, server_error=false) {
        let returnData = { success: false };
        if (!empty(data) || data === "0" || data === 0 || data === "") {
            returnData['data'] = data;
        }
        if(isBoolean(server_error) && server_error){
            returnData.server_error=true;
        }
        return returnData;
    }

    /**
     * uniform expectation of successful response data
     * @param data
     * @return {object}
     */
    sendSuccessResponse(data) {
        let returnData = { success: true };
        if (!empty(data) || data === 0 || data === "0" || data === "") {
            returnData['data'] = data;
        }
        return returnData;
    }

    /**
     * Validating post data with Joi
     * @param {object} schema
     * @param post_data
     * @returns {Promise<void>}
     */
    async validateJoiPost(schema=null, post_data={}){
        let errors={};
        try{
            if(schema && post_data && schema.validate && typeof schema.validate === "function"){

                const { error } = schema.validate(post_data, {abortEarly: false});
                if(!empty(error) && !empty(error.details) && isArray(error.details)) {
                    error.details.map(errorItem => {
                        let errorMessage = (!empty(errorItem) && !empty(errorItem.message)) ? errorItem.message : 'Field could not be validated, please check your payload and try again.';
                        let errorLabel = (!empty(errorItem) && !empty(errorItem.path) && isArray(errorItem.path)) ? `${errorItem.path[1]?`${errorItem.path[1]}_${errorItem.path[0]}`:`field_${errorItem.path[0]}`}`: `field_${(new Date().getTime())}`;
                        errors = {
                            ...errors,
                            [errorLabel]: errorMessage
                        }
                        return false;
                    });
                }
            }
        }catch(err){}
        return errors;
    }

}

module.exports = BaseService;
