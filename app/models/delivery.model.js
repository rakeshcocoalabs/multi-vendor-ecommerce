const mongoose = require('mongoose');


const delivery = mongoose.Schema(
    {
                 status:Number,
                 order_id:String,
                 address:String,
                 agent:String,
                
                
                 vendor:String,
                 assigned_at:Number,
                 picked_at:Number,
                 delivered_at:Number,
				 tSCreatedAt:Number,
				 tSModifiedAt:Number
        
    }
)
module.exports = mongoose.model('delivery',delivery,"Delivery");