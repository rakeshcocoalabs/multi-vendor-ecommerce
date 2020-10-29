const mongoose = require('mongoose');


const category = mongoose.Schema({
	name: String,
	image: String,
	status: Number,
	tSCreatedAt: Number,
	tSModifiedAt: Number

})
module.exports = mongoose.model('Category', category, "Categories");