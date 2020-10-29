const mongoose = require('mongoose');

function transform(ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.status;
    delete ret.tsCreatedAt;
    delete ret.tsModifiedAt;
}
var options = {
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            transform(ret);
        }
    },
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            transform(ret);
        }
    }
};
const EcommerceManagerConfigSchema = mongoose.Schema({
    // name: String,
    onesignalAppId : String,
    onesignalApiKey: String,
    // twillioApiKey: String,
    // msg91ApiKey: String,
    // sendgridApiKey: String,
    status: Number,
    tsCreatedAt: Number,
    tsModifiedAt: Number

},options);
module.exports = mongoose.model('EcommerceManagerConfig', EcommerceManagerConfigSchema, 'EcommerceManagerConfigs');