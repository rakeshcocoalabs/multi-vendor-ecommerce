const mongoose = require('mongoose');


const user = mongoose.Schema(
    {
                 status:Number,
                 name:String,
				 email:String,
				 mobile:String,
                 passwordHash:String,
                 superUser:Number,
                 permissions:{
                    order:Number,
                    product:Number
                 },
				 tSCreatedAt:Number,
				 tSModifiedAt:Number
        
    }
)
module.exports = mongoose.model('Employee',user,"Employees");