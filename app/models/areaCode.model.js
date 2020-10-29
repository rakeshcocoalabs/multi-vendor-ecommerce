const mongoose = require('mongoose');


const areacode = mongoose.Schema(
    {
        status: Number,
        code:String,
        area:String

    }
)
module.exports = mongoose.model('AreaCode', areacode, "AreaCodes");