const mongoose = require('mongoose');


const review = mongoose.Schema({
    content: String,
    productId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product'
    },
    
    user:{
        name:String,
        avatar:String
    },
    rating:Number,
    status: Number,
    tsCreatedAt: Number,
    tSModifiedAt: Number

})
module.exports = mongoose.model('review', review, "Reviews");