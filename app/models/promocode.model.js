const mongoose = require('mongoose');


const code = mongoose.Schema(
    {
                 status:Number,
                 name:String,
				 percent:Number,
				 
				 code:String,
				 maximun_discount:Number,
				 minimum_amount:Number,
				 users: [],
				 tSCreatedAt:Number,
				 tSModifiedAt:Number
        
    }
)
module.exports = mongoose.model('Code',code,"Codes");