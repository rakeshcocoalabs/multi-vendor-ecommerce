const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({   
    image: String,
    status: Number,
    tSCreatedAt: Number,
    tSModifiedAt: Number

})
module.exports = mongoose.model('Banner', bannerSchema, "Banners");