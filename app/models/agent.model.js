const mongoose = require('mongoose');


const user = mongoose.Schema(
    {
                 status:Number,
                 name:String,
				
				 mobile:String,
                 passwordHash:String,
                
                
				 tSCreatedAt:Number,
				 tSModifiedAt:Number
        
    }
)
module.exports = mongoose.model('Agent',user,"Agents");