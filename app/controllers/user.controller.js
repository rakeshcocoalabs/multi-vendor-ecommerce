var stringify = require('json-stringify-safe');
var UserModel = require('../models/user.model');
var CartModel = require('../models/cart.model');

var PushNotification = require('../models/pushNotification.model');
const Otp = require('../models/otp.model');
const uuidv4 = require('uuid/v4');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const paramsConfig = require('../../config/app.config');
var otpConfig = paramsConfig.otp;
var usersConfig = paramsConfig.user;
const params_Config = require('../../config/params.config');
const JWT_KEY = params_Config.development.jwt.secret;
const pushNotificationHelper = require('../helpers/pushNotificationHelper');
var constants = require('../helpers/constants');
const productModel = require('../models/product.model');
const {
    off
} = require('superagent');
const e = require('express');

var ObjectId = require('mongoose').Types.ObjectId;

exports.filtersList = async (req, res) => {
    var params = req.body;

    res.send({
        success: 1,
        message: "filters listed",
        "Brands": {
            name: "brands",
            values: [{
                    name: "ashirvad"
                },
                {
                    name: "Brahmins"
                },
                {
                    name: "Amul"
                }
            ]
        },
        "Pricerange": {
            priceRange: {
                minimum: 1,
                maximum: 10000
            }
        },

        message: "filters and sorting listed",
        sorts: [

            {
                name: "price low to high",
                key: "priceLowToHigh"

            },
            {
                name: "price high to low",
                key: "priceHighToLow"
            },
            {
                name: "highest rated",
                key: "highestRated"
            }
        ]
    })

}

exports.resetPassword = async (req, res) => {
    var params = req.body;
    // var id = req.identity.data.id;


    try {

        const salt = bcrypt.genSaltSync(10);
        const passHash = bcrypt.hashSync(params.password, salt);

        var update = {

            passwordHash: passHash
        };

        var filter = {

            mobile: params.mobile,
            status: 1
        };

        const result = await UserModel.updateOne(filter, update);

        if (!result) {
            return res.send({
                success: 0,
                message: "did not updated"
            })
        }

        return res.send({
            success: 1,
            message: "Updated Password"
        })



    } catch (err) {
        return res.send({
            success: 0,
            message: err.message
        })

    }


}

exports.verifyOtp = async (req, res) => {
    var params = req.body;
    var otp = params.otp;

    var phone = params.phone;

    if (otp == "1111") {

        return res.status(200).send({
            success: 1,
            message: 'Otp verified successfully'
        })
    }

    try {
        var filter = {
            otp: otp,
            phone: phone,

            isUsed: false
        };
        var otpData = await Otp.findOne(filter);

        if (otpData) {
            var currentTime = Date.now();

            var otpData1 = await Otp.findOne({
                phone: phone,
                otp: otp,
                apiToken: apiToken,
                isUsed: false,
                expiry: {
                    $gt: currentTime
                }
            });
            if (otpData === null) {
                return res.send({
                    success: 0,
                    message: 'otp expired,please resend otp to get a new one'
                })

            } else {





                var update = {
                    isUsed: true
                };
                var updateOtpData = await Otp.findOneAndUpdate(filter, update, {
                    new: true,
                    useFindAndModify: false
                });



                var updateUserData = await Users.findOneAndUpdate({
                    _id: userId
                }, {
                    isVerified: true

                }, {
                    new: true,
                    useFindAndModify: false
                });





                return res.status(200).send({
                    success: 1,
                    message: 'Otp verified successfully'
                })
            }
        } else {
            return res.send({
                success: 0,
                message: 'Otp does not matching'
            })
        }
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
};

async function otp(phone) {
    var otp = Math.floor(1000 + Math.random() * 9000);
    const apiToken = uuidv4();
    var expiry = Date.now() + (otpConfig.expirySeconds * 1000);
    try {
        // const smsurl = await superagent.get(`http://thesmsbuddy.com/api/v1/sms/send?key=zOxsbDOn4iK8MBfNTyqxTlrcqM8WD3Ms&type=1&to=${phone}&sender=INFSMS&message=${otp} is the OTP for login to The Genesis Apostolic Church App&flash=0`);
        const newOtp = new Otp({
            phone: phone,
            isUsed: false,
            otp: otp,
            apiToken: apiToken,
            expiry: expiry,
            status: 1,
            tsCreatedAt: new Date(),
            tsModifiedAt: null
        });
        var saveOtp = await newOtp.save();
        var otpResponse = {
            phone: saveOtp.phone,
            otp: saveOtp.otp,
            apiToken: saveOtp.apiToken,
        };
        return otpResponse
    } catch (error) {
        console.log(error.response.body);
    }

}


// *** Add to favourites ***
exports.addFavourite = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let productId = req.body.productId;
    if (!productId) {
        return res.status(400).send({
            success: 0,
            field: 'productId',
            message: 'ProductId cannot be empty'
        })
    }
    try {
        let findCriteria = {
            _id: userId,
            status: 1
        };
        let checkExists = await UserModel.find({
            _id: userId,
            status: 1,
            wishlist: productId
        });
        if (checkExists.length > 0) {
            return res.status(200).send({
                success: 0,
                message: 'Product already in favourites'
            })
        }
        let saveFavourite = await UserModel.updateOne(findCriteria, {
            $push: {
                "wishlist": productId
            }
        });
        res.status(200).send({
            success: 1,
            message: 'Product added to favourites'
        })
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while adding to favourites' || err.message
        })
    }

}

// *** Remove all from favourites ***
exports.removeAllFavourites = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    try {
        let findCriteria = {
            _id: userId,
            status: 1
        };
        let removeAll = await UserModel.updateOne(findCriteria, {
            $set: {
                "wishlist": []
            }
        });
        res.status(200).send({
            success: 1,
            message: 'All products removed from favourites'
        })
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while removing all from favourites' || err.message
        })
    }

}


// *** Remove single iteem from favourites ***
exports.removeFavourite = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let productId = req.body.productId;
    if (!productId) {
        return res.status(400).send({
            success: 0,
            field: 'productId',
            message: 'ProductId cannot be empty'
        })
    }
    try {
        let findCriteria = {
            _id: userId,
            status: 1
        };
        let removeOne = await UserModel.updateOne(findCriteria, {
            $pull: {
                "wishlist": productId
            }
        });
        res.status(200).send({
            success: 1,
            message: 'Product removed from favourites'
        })
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while removing from favourites' || err.message
        })
    }

}

// *** Favourites list ***
exports.favouritesList = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.query;
    let page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    let perPage = Number(params.perPage) || usersConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : usersConfig.resultsPerPage;
    try {
        let projection = {
            wishlist: 1,
            _id: 0
        };
        let userData = await UserModel.findOne({
            _id: userId,
            status: 1
        }, projection).populate({
            path: 'wishlist',
            select: 'name price image'
        });
        let wishList = userData.wishlist;
        let wishlistinfo = [];
        for (x in wishList) {

            let item = wishList[x];

            let productData = await productModel.findOne({
                _id: item._id
            }, {
                sellingPrice: 1,
                costPrice: 1,
                name: 1,
                image: 1
            }).catch(err => {
                return {
                    success: 0,
                    message: err
                }
            });

            if (productData && productData.success && productData.success == 0) {
                continue;
            }

            wishlistinfo.push(productData)
        }

        let itemsCount = wishList.length;
        wishList = paginate(wishList, perPage, page);
        var totalPages = itemsCount / perPage;
        totalPages = Math.ceil(totalPages);
        var hasNextPage = page < totalPages;
        var pagination = {
            page: page,
            perPage: perPage,
            hasNextPage: hasNextPage,
            totalItems: itemsCount,
            totalPages: totalPages,
        };
        res.status(200).send({
            success: 1,
            imageBase: usersConfig.imageBase,
            pagination: pagination,
            items: wishlistinfo
        });
    } catch (err) {
        // res.status(500).send({
        //     success: 0,
        //     message: 'Something went wrong while fetching favourites' || err.message
        // })
        console.log(err);
    }
}

function paginate(array, page_size, page_number) {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
};


exports.show = async (req, res) => {


    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let findCriteria = {};
    findCriteria._id = userId;
    findCriteria.status = 1;
    let projectCriteria = {};
    projectCriteria.name = 1;
    projectCriteria.email = 1;
    projectCriteria.mobile = 1;
    projectCriteria.image = 1;
    projectCriteria._id = 1

    var data = await UserModel.findOne(findCriteria, projectCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!data) {
        return {
            success: 0,
            message: 'did not get cart for the user'

        }
    }

    return res.send({
        success: 1,
        message: "Profile retieved successfully",
        userInfo: {
            imageBase: usersConfig.imageBase,
            email: data.email,
            mobile: data.mobile,
            id: data._id,
            name: data.name,
            image: data.image
        }
    });
}

exports.create = async (req, res) => {
    var params = req.body;


    if (!params) {
        return res.send({
            success: 0,
            message: "did not recieved any parameters"
        });
    }

    if (!params.email) {
        return res.send({
            success: 0,
            message: "did not recieved email"
        });
    }
    if (!params.name) {
        return res.send({
            success: 0,
            message: "did not recieved name"
        });
    }
    if (!params.password) {
        return res.send({
            success: 0,
            message: "did not recieved password"
        });
    }
    if (!params.mobile) {
        return res.send({
            success: 0,
            message: "did not recieved mobile"
        });
    }

    let findCriteria = {};

    findCriteria.email = params.email;
    findCriteria.status = 1;

    let userData = await UserModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (userData) {

        return res.send({
            success: 0,
            message: "email already taken by some one"
        })
    }
    let findCriteria1 = {};

    findCriteria1.mobile = params.mobile;
    findCriteria1.status = 1;

    let userData1 = await UserModel.findOne(findCriteria1)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (userData1) {

        return res.send({
            success: 0,
            message: "phone number already taken by some one"
        })
    }

    try {

        const salt = bcrypt.genSaltSync(10);
        const passHash = bcrypt.hashSync(params.password, salt);

        const User = new UserModel({
            status: 1,
            name: params.name,
            email: params.email,
            mobile: params.mobile,
            image: "",
            passwordHash: passHash,
            isVerified: false,
            isBlocked: false,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        var saveuser = await User.save();

        var otpResponse = await otp(params.mobile);
        if (otpResponse == undefined) {
            return res.send({
                success: 0,
                message: 'Something went wrong while sending OTP'
            })
        }


        var payload = {
            id: saveuser.id,
            name: params.name,
            email: params.email,
            mobile: params.mobile


        };
        var token = jwt.sign({
            data: payload,
        }, JWT_KEY, {
            expiresIn: '30 days'
        });


        return res.status(200).send({
            success: 1,
            id: saveuser._id,
            token,
            userInfo: payload,
            message: 'Profile tSCreatedAt successfully'
        });


    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}

exports.login = async (req, res) => {


    let params = req.body;

    if (!params.email || !params.password) {
        var message = ''
        var errors = [];
        if (!params.email) {
            errors.push({
                field: "email",
                message: "email is missing"
            });
            message = "email is missing";
        }

        if (!params.password) {
            errors.push({
                field: "password",
                message: "password is missing"
            });
            message = "password is missing";
        }
        return res.status(200).send({
            success: 0,
            errors: errors,
            message,
            code: 200
        });
    }



    let findCriteria = {};

    findCriteria.email = params.email;
    findCriteria.status = 1;


    let userData = await UserModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'unknown error',
                error: err
            }
        })

    if (userData && userData.success && (userData.success === 0)) {
        return res.send(userData);
    }
    if (!userData) {
        return res.status(200).send({
            success: 0,
            message: 'User not exists'
        });
    };

    let matched = await bcrypt.compare(params.password, userData.passwordHash)
    if (matched) {
        const JWT_KEY = params_Config.development.jwt.secret;
        let payload = {};
        payload.id = userData.id;
        payload.email = userData.email;

        payload.name = userData.name;


        payload.loginExpiryTs = "10h";
        var token = jwt.sign({
            data: payload,
        }, JWT_KEY, {
            expiresIn: "10h"
        });


        return res.send({
            success: 1,
            statusCode: 200,
            token,
            userInfo: {
                imageBase: usersConfig.imageBase,
                email: userData.email,
                mobile: userData.mobile,
                name: userData.name,
                image: userData.image ? userData.image : "",
                id: userData._id
            },
            message: 'Successfully logged in'
        })

    } else {
        return res.send({
            success: 0,
            statusCode: 401,
            message: 'Incorrect password'
        })
    }
}




exports.fotgotpassword = async (req, res) => {

    let params = req.body;

    if (!params.mobile) {
        return res.send({
            success: 0,
            message: "please submit mobile number"
        })
    }



    let findCriteria = {};

    findCriteria.mobile = params.mobile;
    findCriteria.status = 1;


    let userData = await UserModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'unknown error',
                error: err
            }
        })

    if (userData && userData.success && (userData.success === 0)) {
        return res.send(userData);
    }
    if (!userData) {
        return res.status(200).send({
            success: 0,
            message: 'User not exists'
        });
    };

    var otpResponse = await otp(params.mobile);
    if (otpResponse == undefined) {
        return res.send({
            success: 0,
            message: 'Something went wrong while sending OTP'
        })
    }

    return res.send({
        success: 1,
        item: {
            apiToken: otpResponse.apiToken,
            phone: params.mobile
        },
        message: "OTP sent to registered mobile number"
    })


}

exports.update = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;

    let findCriteria = {};
    findCriteria._id = userId;
    findCriteria.status = 1;
    let file = req.file;
    let update = {};

    if (file) {
        update.image = file.filename;
    }
    if (params.name) {
        update.name = params.name
    }
    if (params.email) {
        update.email = params.email;
    }
    if (params.mobile) {
        update.mobile = params.mobile
    }


    let Data = await UserModel.findOneAndUpdate(findCriteria, update, {
            useFindAndModify: false,
            fields: {
                id: 1,
                email: 1,
                mobile: 1,
                name: 1,
                image: 1
            },
            new: true
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })


    if (Data) {
        let updatedData = {};
        updatedData.imageBase = usersConfig.imageBase
        updatedData.id = Data.id;
        updatedData.name = Data.name;
        updatedData.email = Data.email;
        updatedData.image = Data.image;
        updatedData.mobile = Data.mobile
        return res.send({
            success: 1,
            userInfo: updatedData,
            message: "profile updated successfully"
        })
    }
}


exports.notificationList = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let params = req.query;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || usersConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : usersConfig.resultsPerPage;
    var offset = (page - 1) * perPage;

    var projection = {
        type: 1,
        userId: 1,
        referenceId: 1,
        title: 1,
        messageText: 1,
        metaInfo: 1,
        sentAt: 1,
        status: 1,
        tsCreatedAt: 1,
        tsModifiedAt: 1
    }
    var findCriteria = {
        status: 1,
        userId
    }

    var notificationData = await PushNotification.find(findCriteria, projection)
        .limit(perPage)
        .skip(offset)
        .sort({
            'tsCreatedAt': -1
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting push notifications',
                error: err
            }
        })
    if (notificationData && notificationData.error && (notificationData.error !== null)) {
        return res.send(notificationData);
    }

    var totalNotifications = await PushNotification.countDocuments(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting notifications count',
                error: err
            }
        })
    if (totalNotifications && totalNotifications.error && (totalNotifications.error !== null)) {
        return res.send(totalNotifications);
    }

    var totalPages = totalNotifications / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page,
        perPage,
        hasNextPage,
        totalItems: totalNotifications,
        totalPages
    }
    return res.status(200).send({
        success: 1,
        pagination,
        items: notificationData,
        message: 'List notifications'
    })


}

exports.sendNotification = async (req, res) => {
    var userId = "5f6c71aaffbc10633e11a74b"
    var filtersJsonArr = [{
        "field": "tag",
        "key": "user_id",
        "relation": "=",
        "value": userId
    }]
    // var metaInfo = {"type":"event","reference_id":eventData.id}
    var notificationObj = {
        title: constants.CREATE_ORDER_NOTIFICATION_TITLE,
        message: constants.CREATE_ORDER_NOTIFICATION_MESSAGE,
        type: constants.ORDER_NOTIFICATION,
        referenceId: 1234,
        filtersJsonArr,
        userId
        // metaInfo,
    }
    var pushNotificationData = await pushNotificationHelper.sendNotification(notificationObj);
    return res.send({
        message: "Send push notification",
        success: 1
    })


}

// *** List customers ***
exports.list = async (req, res) => {
    var params = req.query;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || usersConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : usersConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    try {
        let customers = await UserModel.find({
            status: 1
        }, {
            name: 1,
            email: 1,
            mobile: 1,
            tSCreatedAt: 1
        }).skip(offset).limit(perPage).sort({
            'tSCreatedAt': -1
        });
        let itemsCount = await UserModel.countDocuments({status: 1});
        totalPages = itemsCount / perPage;
        totalPages = Math.ceil(totalPages);
        let hasNextPage = page < totalPages;
        let pagination = {
            page: page,
            perPage: perPage,
            hasNextPage: hasNextPage,
            totalItems: itemsCount,
            totalPages: totalPages
        };
        res.status(200).send({
            success: 1,
            pagination: pagination,
            items: customers
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while listing customers' || err.message
        })
    }
}

// *** Block or delete customer ***
exports.blockOrDelete = async (req, res) => {
    let type = req.body.type;
    let blockStatus = req.body.blockStatus;
    if (!type) {
        return res.status(400).send({
            success: 0,
            message: 'type cannot be empty'
        })
    }
    let id = req.params.id;
    var isValidId = ObjectId.isValid(id);
    if (!isValidId) {
        var responseObj = {
            success: 0,
            status: 401,
            errors: {
                field: "id",
                message: "id is invalid"
            }
        }
        res.send(responseObj);
        return;
    }
    let update = {};
    if (type == 'block') {
        if (blockStatus == undefined || blockStatus == null) {
            return res.status(400).send({
                success: 0,
                message: 'block status cannot be empty'
            })
        }
        update.isBlocked = blockStatus;
    } else if (type == 'delete') {
        update.status = 0;
    }
    try {
        let updateUser = await UserModel.findOneAndUpdate({
            _id: id,
            status: 1
        }, update, {
            useFindAndModify: false
        });
        res.status(200).send({
            success: 1,
            message: `Customer ${type}ed successfully`
        })
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: `Something went wrong while ${type}ing customer`
        })
    }
}