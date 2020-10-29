var stringify = require('json-stringify-safe');
var FeedbackModel = require('../models/feedback.model');
var UserModel = require('../models/user.model');
const paramsConfig = require('../../config/app.config');

var otpConfig = paramsConfig.otp;

    exports.create = async (req, res) => {

         let userDataz = req.identity.data;
         let userId = userDataz.id;
        let params = req.body;
        if (!params) {
            return res.send({
                success: 0,
                "message": "did not recieved any parameters"
            });
        }
        if (!params.message) {
            return res.send({
                success: 0,
                "message": "did not recieved any  messages"
            });
        }
       
        let user = await UserModel.findOne({_id:userId},{name:1,image:1})

        try {
            const feedback = new FeedbackModel({
                status: 1,
                feedback_message: params.message,
                user:user._id,
                productId:params.product,
                rating:params.rating,
                tSCreatedAt: Date.now(),
                tSModifiedAt: null
            });
            var save_feedback = await feedback.save();
            return res.send({
                success: 1,
                message: "message stored successfully"
            })
        } catch (err) {
            res.status(500).send({
                success: 0,
                message: err.message
            })
        }
    }
