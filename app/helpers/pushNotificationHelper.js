const OneSignal = require('onesignal-node');
var config = require('../../config/app.config.js');
var PushNotification = require('../models/pushNotification.model');
var EcommerceManagerConfigs = require('../models/ecommerceManagerConfigs.model');
// var Church = require('../models/church.model');
var constants = require('../helpers/constants');
// var oneSignalConfig = config.oneSignal;

module.exports = {
    sendNotification: async function (notificationObj) {
        var projection = {
            onesignalAppId: 1,
            onesignalApiKey: 1,
        }
        var filterCriteria = {
            status: 1
        }
        var ecommerceManagerConfigsData = await EcommerceManagerConfigs.findOne(filterCriteria, projection)
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while getting e commerce manager config data',
                    error: err
                }
            })

        if (ecommerceManagerConfigsData && (ecommerceManagerConfigsData.success !== undefined) && (ecommerceManagerConfigsData.success === 0)) {
            return res.send(ecommerceManagerConfigsData);
        }
        if(ecommerceManagerConfigsData){
        const oneSignalClient = new OneSignal.Client(ecommerceManagerConfigsData.onesignalAppId, ecommerceManagerConfigsData.onesignalApiKey);

        var notificationData = {
            // contents: message,
            contents: {
                "tr": notificationObj.message,
                "en": notificationObj.message,
            },
            headings: {
                "en": notificationObj.title
            },
            subtitle: {
                "en": notificationObj.message,
            },
            data: {
                "type": notificationObj.type,
                "reference_id": notificationObj.referenceId,
            }
            ,
            included_segments: null,
            filters: notificationObj.filtersJsonArr
        };
        console.log("notificationData");
        console.log(notificationData);
        console.log("notificationData");
        // using async/await
        try {
        const response = await oneSignalClient.createNotification(notificationData);
        console.log("response");
        console.log(response);
        console.log("response");
        console.log(response.body.id);
        var notificationLogObj = {};
        notificationLogObj.type = notificationObj.type;
        notificationLogObj.title = notificationObj.title;
        notificationLogObj.messageText = notificationObj.message;
        notificationLogObj.filtersJsonArr = notificationObj.filtersJsonArr;
        if (notificationObj.userId) {
            notificationLogObj.userId = notificationObj.userId;
        }
        // if (notificationObj.type === constants.EVENT_NOTIFICATION) {
        //     notificationLogObj.eventId = notificationObj.referenceId;
        // }
        // if (notificationObj.type === constants.CHARITY_NOTIFICATION) {
        //     notificationLogObj.charityId = notificationObj.referenceId;
        // }
        // if (notificationObj.type === constants.SERMON_NOTIFICATION) {
        //     notificationLogObj.sermonsId = notificationObj.referenceId;
        // }

        notificationLogObj.referenceId = notificationObj.referenceId;
        notificationLogObj.metaInfo = null;
        // notificationLogObj.isSent = 0;
        // notificationLogObj.sentAt = new Date();
        notificationLogObj.sentAt = Date.now();
        notificationLogObj.status = 1;
        notificationLogObj.tsCreatedAt = Date.now();
        notificationLogObj.tsModifiedAt = null;
        var logObj = new PushNotification(notificationLogObj);
        var notificationData = await logObj.save()
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while saving push notifocation log',
                    error: err
                }
            })
        if (notificationData && (notificationData.success !== undefined) && (notificationData.success === 0)) {
            return notificationData;
        }
        

        return notificationData;

        } catch (e) {
            console.log("e")
            console.log(e)
            console.log("e")
            if (e instanceof OneSignal.HTTPError) {
                // When status code of HTTP response is not 2xx, HTTPError is thrown.
                console.log(e.statusCode);
                console.log(e.body);
            }
            return e;

        }
    }else{
        return {
            message : 'Push notification not implemented',
            status : 1
        };
    }

    },

}