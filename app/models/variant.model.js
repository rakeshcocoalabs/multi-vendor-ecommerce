const mongoose = require('mongoose');


const variants = mongoose.Schema({
    size: Number,
    stockAvailable: Number,
    parent: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Product'
	},
    costPrice: Number,
    sellingPrice:Number,
    isAvailable: Boolean,
    currency: String,
    unit: String,
    status: Number,
    tsCreatedAt: Number,
	tsModifiedAt: Number
});
module.exports = mongoose.model('Variant', variants, "Variants");