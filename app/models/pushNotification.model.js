const mongoose = require('mongoose');
const { STRING } = require('sequelize');

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
const PushNotificationSchema = mongoose.Schema({
    type : String,
    // eventId : {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'Post' 
    // },
    // charityId : {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'Charity' 
    // },
    // sermonsId : {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'Post' 
    // },
    // churchId : {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'Church' 
    // },
    userId : {
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    },
    // isSent: Number,
    referenceId: String,
    title: String,
    messageText: String,
    filtersJsonArr: Array,
    segmentsCsv: Array,
    metaInfo : String,
    sentAt : Number,
    status: Number,
    tsCreatedAt: Number,
    tsModifiedAt: Number

},options);
module.exports = mongoose.model('PushNotification', PushNotificationSchema, 'PushNotifications');