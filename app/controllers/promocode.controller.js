var stringify = require('json-stringify-safe');
var EmpModel = require('../models/employee.model');
var CodeModel = require('../models/promocode.model');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const paramsConfig = require('../../config/app.config');

const { hashSync } = require('bcryptjs');

	exports.create = async (req,res) => {
        let userDataz = req.identity.data;
        let userId = userDataz.id;
        let params = req.body;

    
		if (!params) {user
			return res.send({
				success:0,
				msg: "did not recieved any parameters"
			});
		}

		let findCriteria = {};

        findCriteria._id = userId;
        findCriteria.status = 1;

       // return res.send(userId)

		let userData = await EmpModel.findOne(findCriteria)
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while checking phone',
                    error: err
                }
            })
        if (!userData) {

            return res.send("user not authorised  7")
        }

        if (!userData.superUser){
            return res.send("user not authorised")
        }

        if (userData.superUser == 2){
            return res.send("user not authorised")
        }

        const randomcode = await CodeModel.find({code:params.code}).catch(err => {
            console.log(err.message);
        })
        if (randomcode.length > 0){
            return res.send({
                success:0,
                msg:"promocode exists please try another one"
            })
        }

		try {

			
			const Code = new CodeModel({
				 status:1,
				 name:params.name,
				
				 percent:params.percent,
                 code:params.code,
                 maximum_discount:params.maximum_discount,
                 minimum_amount:params.minimum_amount,
				 tSCreatedAt:Date.now(),
				 tSModifiedAt:null
			 });
             var savecode = await Code.save();
             
             
            return res.send({
                success:1,
                message:"promocode added successfully"
            })
        
			 
		 } catch (err) {
			 res.status(500).send({
				 success: 0,
				 message: err.message
			 })
		 }
	}
