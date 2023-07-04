const BaseService = require('./base');
const ShowModel = require('../models/show');
const Joi = require('joi');
const {APPLICATION_ERROR} = require('../lib/error-messages');
const { empty, isObject, isArray } = require('../lib/utils');
const BaseModel = require('../models/base');

class ShowsService extends BaseService {
    constructor() {
        super()
    }

    /**
     * Service to create shows based on request post payload
     * @param {*} post_data
     * @returns {object}
     */
    async addUpdate(post_data = null) {
        try {

            if(!(
                post_data && isArray(post_data)
            )){
                return this.sendFailedResponse({api_request: "Invalid payload provided!"});
            }

            //Defining validation schema for post payload
            const schema = Joi.array().items(Joi.object().keys({
                showId: Joi.number()
                    .required()
                    .strict(true)
                    .label("Show ID"),

                showDate: Joi.string()
                    .required()
                    .pattern(/^(?:(0[1-9]|1[012])[\/.](0[1-9]|[12][0-9]|3[01])[\/.](19|20)[0-9]{2})$/)
                    .label("Show Date (MM/DD/YYYY)")
                    .messages({
                        "string.pattern.base": `Show Date' must be valid. Date must be in the format MM/DD/YYYY`
                    }),
                showName: Joi.string()
                    .pattern(/^[A-Za-z \-0-9]+$/)
                    .required()
                    .label("Show Name"),
                showStatus: Joi.string()
                    .required()
                    .pattern(/^[A-Za-z 0-9]+$/)
                    .label("Show Status")
                    .valid("Active", "Inactive"),

            })).min(1)
                .label("Payload")

            let errors = await this.validateJoiPost(schema, post_data);

            let returnData = [];


            // check for errors and create shows if no errors
            let atleast_one_error_occurred=false;
            if (empty(errors)) {

                const showModel = new ShowModel();
                for(let counter=0;counter<post_data.length;counter++){
                    const currentShow = post_data[counter]?post_data[counter]:null;
                    let error = null;
                    if(currentShow && currentShow.showId) {

                        let existingShow=null;
                        try{
                            existingShow =  await showModel.getRecord({showId: currentShow.showId})
                        }catch (err){}

                        let add_update_show_data = {
                            showName: currentShow.showName,
                            showDate: currentShow.showDate,
                            showStatus: currentShow.showStatus,
                        };

                        //check if show already exists and update record or add new
                        if(existingShow && existingShow._id){

                            //saving show data to DB
                            let updateResult = null;
                            try{
                                updateResult = await showModel.update(add_update_show_data, ShowModel.getMongoStringId(existingShow._id));
                            }catch(err){
                                error = err;
                                atleast_one_error_occurred=true;
                            }

                            if(!empty(updateResult)){
                                let returnUpdateResult = {
                                    ...existingShow,
                                    ...updateResult
                                }

                                try {
                                    delete returnUpdateResult._id;
                                } catch (err) {
                                    returnUpdateResult._id = null;
                                }

                                returnData=[
                                    ...returnData,
                                    {
                                        showId: currentShow.showId,
                                        success: true,
                                        data: returnUpdateResult
                                    }
                                ]
                            }else{
                                returnData=[
                                    ...returnData,
                                    {
                                        showId: currentShow.showId,
                                        success: false,
                                        error: `We couldn't process your request at the moment, please try again. ${error?`Ref: ${error}`:''}`
                                    }
                                ]
                            }
                        }else{

                            //showId does not exist. Go ahead and create new show
                            add_update_show_data.showId = currentShow.showId;

                            let addResult=null;
                            try {
                                addResult = await showModel.add(add_update_show_data);
                            } catch (err) {
                                error = err;
                                atleast_one_error_occurred=true;
                            }

                            if(addResult){
                                returnData=[
                                    ...returnData,
                                    {
                                        showId: currentShow.showId,
                                        success: true,
                                        data: addResult
                                    }
                                ]
                            }else{
                                returnData=[
                                    ...returnData,
                                    {
                                        showId: currentShow.showId,
                                        success: false,
                                        error: `We couldn't process your request at the moment, please try again. ${error?`Ref: ${error}`:''}`
                                    }
                                ]
                            }
                        }
                    }
                }
                if(atleast_one_error_occurred){
                    return this.sendFailedResponse(returnData, true);
                }else{
                    return this.sendSuccessResponse(returnData);
                }

            }
            return this.sendFailedResponse(errors);
        } catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

    /**
     * Service to list all shows
     * @param {*} search_constraints
     * @returns {object}
     */
    async listShows(search_constraints = {}) {
        try {
            search_constraints = (search_constraints && isObject(search_constraints)) ? search_constraints : {};

            //getting list of shows and return retrieved records if no errors
            let showsData = [];
            const showModel = new ShowModel();
            try {
                showsData = await showModel.getRecords(search_constraints);
                if(!empty(showsData) && isArray(showsData)){
                    showsData = showsData.map(show=>{
                        if(show._id) {
                            show.id = BaseModel.getMongoStringId(show._id);
                            try {
                                delete show._id;
                            } catch (err) {
                                show._id = null;
                            }
                        }
                        return show;
                    })
                }
            } catch (err) {
                throw new Error (APPLICATION_ERROR.app)
            }
            return this.sendSuccessResponse(showsData);
        } catch (err) {
            return this.sendFailedResponse(APPLICATION_ERROR);
        }
    }

}

module.exports = ShowsService;
