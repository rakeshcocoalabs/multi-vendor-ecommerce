const mongoose = require('mongoose');
const { boolean } = require('joi');


const vendor = mongoose.Schema(
    {
                 status:Number,
				 name:String,
				 shopName:String,
				 email:String,
				 mobile:String,
				 passwordHash:String,
				 delivery_agents:[String],
				 tSCreatedAt:Number,
				 tSModifiedAt:Number,
				 orderHistory: [
					{
						orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
						product:{
							productId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
								quantity:Number,
								price:Number,
								totalPrice:Number
						},
						
						customerId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
						tsDeliveredAt: Number,
						isCancelled:{ 
							default:false,
							type:Boolean
						},
						tsCancelledAt: Number,
					}
				],
				 image:String
        
    }
)
module.exports = mongoose.model('Vendor',vendor,"Vendors");