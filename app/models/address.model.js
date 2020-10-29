const mongoose = require('mongoose');


const address = mongoose.Schema(
    {
        status: Number,
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addressLane: String,
        city: String,
        phone: String,
        name: String,
        pin: String,
        default: Boolean,
        tSCreatedAt: Number,
        tSModifiedAt: Number

    }
)
module.exports = mongoose.model('Address', address, "Addresses");