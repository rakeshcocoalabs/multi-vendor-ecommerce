const mongoose = require('mongoose');


const deliveryAgent = mongoose.Schema(
    {
                 status:Number,
                 name:String,
				 email:String,
				 mobile:String,
				 passwordHash:String,
				 ordersAssigned:[
					 {
						type: mongoose.Schema.Types.ObjectId, ref: 'cart'
					 }
				 ],
				 areaCode:String,
				 tSCreatedAt:Number,
				 tSModifiedAt:Number
        
    }
)
module.exports = mongoose.model('Agent',deliveryAgent,"Agents");