var UserModel = require('../models/deliveryAgent.model');
var areacode = require('../models/areaCode.model');
var CartModel = require('../models/cart.model');
var VendorModel = require('../models/vendor.model');
var varantModel = require('../models/cart.model');
var addressModel = require('../models/address.model');
var bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const Otp = require('../models/otp.model');
const paramsConfig = require('../../config/app.config');

var usersConfig = paramsConfig.user;
const params_Config = require('../../config/params.config');
//const paramsConfig = require('../../config/app.config');
var otpConfig = paramsConfig.otp;
const employeeModel = require('../models/employee.model');
const cartModel = require('../models/cart.model');
const { updateOne, findOne } = require('../models/areaCode.model');

const JWT_KEY = params_Config.development.jwt.secret;


exports.login = async (req, res) => {


    let params = req.body;

    if (!params.phone) {
        return res.send({
            success: 0,
            message: "please submit mobile number"
        })
    }



    let findCriteria = {};

    findCriteria.mobile = params.phone;
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


    var otpResponse = await otp(params.phone);
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
            phone: params.mobile,
            otp: otpResponse.otp
        },
        message: "OTP sent to registered mobile number"
    })

}

exports.update = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    let id = params.id;
    let update = params.update;
    var newValue = {};
    if (update == "accepted") {
        newValue.deliveryStatus = "accepted";
    }
    if (update == "picked") {
        newValue.deliveryStatus = "picked";
    }
    if (update == "delivered") {
        newValue.deliveryStatus = "delivered";
    }

    let cartData = await CartModel.updateOne({ _id: id }, newValue)
        .catch(err => {
            return {
                success: 0,
                message: 'unknown error',
                error: err
            }
        })

    if (cartData && cartData.success && (cartData.success === 0)) {
        return res.send({
            success: 0,
            message: "DB error"
        });
    }

    if (cartData) {
        if (update == "delivered"){
            await this.pushToVendorHistory(id,userId)
        }
        return res.send({
            success: 1,
            message: "updated status"
        })
    }

}

exports.list = async (req, res) => {


    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let query = req.query;


    var page = query.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(query.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };




    let findCriteria = {};

    if (query.keyword) {
        var search = query.keyword;
        findCriteria = {
            _id: {
                $regex: search,
                $options: 'i',
            }
        };

    }


    findCriteria.status = 1;
    findCriteria.assignee = userId;
    findCriteria.isConvertedToOrder = true;

    if (!query.status) {
        return res.send({
            success: 0,
            message: "please specify status "
        })
    }
    if (query.status == "assigned") {
        findCriteria.deliveryStatus = "assigned";
    }

    if (query.status == "accepted") {
        findCriteria.deliveryStatus = "accepted";
    }
    if (query.status == "picked") {
        findCriteria.deliveryStatus = "picked";
    }
    if (query.status == "delivered") {
        findCriteria.deliveryStatus = "delivered";
    }


    let projection = {};

    projection.address = 1;



    let cartData = await CartModel.find(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'unknown error',
                error: err
            }
        })

    if (cartData && cartData.success && (cartData.success === 0)) {
        return res.send({
            success: 0,
            message: "DB error"
        });
    }

    // return res.send(cartData);
    if (!cartData) {
        return res.status(200).send({
            success: 0,
            message: 'orders not exists'
        });
    };
    var objectArray = [];
    for (x in cartData) {

        let address = await addressModel.findOne({ _id: cartData[x].deliveryAddress }, { addressLane: 1, phone: 1, city: 1, name: 1, pin: 1 })
            .catch(err => {
                return {
                    success: 0,
                    message: 'unknown error',
                    error: err
                }
            })


        if (address && address.success && (address.success === 0)) {
            continue;
        }
        if (!address) {
            continue;
        }

        let object = {};
        object.id = cartData[x]._id;
        object.deliveryTime = cartData[x].deliveredAt;
        object.orderNumber = cartData[x].orderNo;
        object.pickingTime = cartData[x].pickedAt;
        object.address = address;
        if (query.status == "delivered") {
            object.fromAddress = cartData[x].fromAddress;
        }
        else {
            object.shopName = cartData[x].shopName;
        }
        objectArray.push(object);
    }

    if (objectArray.length == 0) {
        return res.send({
            success: 0,

            message: "order list is empty"
        })
    }
    var itemsCount = await CartModel.countDocuments(findCriteria).catch(err => {
        return {
            success: 0,
            message: 'Something went wrong while checking phone',
            error: err
        }
    });
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    let pageNum = Number(page) || "";
    let contentPage = Number(perPage) || "";
    var pagination = {
        page: pageNum,
        perPage: contentPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }

    return res.send({
        success: 1,
        orders: objectArray,
        pagination,
        message: "listed orders"
    })





}

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
        console.log(error.message);
    }

}

exports.getOrderDetail = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;


    let params = req.body;
    if (!params) {
        return res.send({
            success: 0,
            message: "please mention category and id"
        })
    }

    let orderId = params.id;
    if (!orderId) {
        return res.send({
            success: 0,
            message: "please mention order id"
        })
    }
    let statusId = params.statusId;
    if (!statusId) {
        return res.send({
            success: 0,
            message: "please mention status "
        })
    }

    if (!((statusId == "assigned") || (statusId == "accepted") || (statusId == "picked") || (statusId == "delivered"))) {
        return res.send({
            success: 0,
            message: "please mention valid status "
        })
    }

    var findCriteria = {
        // assignee: userId,
        _id: orderId,
        // deliveryStatus: statusId,
        //  isConvertedToOrder: true,
        //   status: 1
    }
    var projection = {
        status: 0,
        tsModifiedAt: 0,
        isConvertedToOrder: 0,
        CheckedOut: 0,
        modified: 0,
        orderStatus: 0,
        statusHistory: 0

    }

    var orderData = await CartModel.findOne(findCriteria, projection)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting order details',
                error: err
            }
        })
    if (orderData && orderData.success && (orderData.success === 0)) {
        return res.send(orderData);
    }





    if (orderData) {


        let address = await addressModel.findOne({ _id: orderData.deliveryAddress }, { addressLane: 1, phone: 1, city: 1, name: 1, pin: 1 })
            .catch(err => {
                return {
                    success: 0,
                    message: 'unknown error',
                    error: err
                }
            })




        let object = {};
        object = orderData;
        if (statusId == "delivered") {
            object.fromAddress = orderData.fromAddress;
        }
        else {
            object.shopName = orderData.shopName;
        }

        object.grandTotal = object.subTotal + object.deliveryCharge - object.discount;
        return res.send({
            success: 1,
            // imageBase: productsConfig.imageBase,
            item: object,
            message: 'Order details'
        })
    } else {
        return res.send({
            success: 0,
            message: "Order not exists"
        })
    }
}


exports.verifyOtp = async (req, res) => {
    var params = req.body;
    var otp = params.otp;

    var phone = params.phone;
    var apiToken = params.apiToken;
    try {
        var filter = {
            otp: otp,
            phone: phone,
            apiToken: apiToken,
            isUsed: false
        };
        var otpData = await Otp.findOne(filter);

        if (otpData) {
            var currentTime = Date.now();

            var otpData = await Otp.findOne({
                phone: phone,
                otp: otp,

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



                var userData = await UserModel.findOne({
                    mobile: params.phone
                });

                const JWT_KEY = params_Config.development.jwt.secret;
                let payload = {};
                payload.id = userData.id;
                payload.phone = userData.mobile;

                payload.name = userData.name;


                payload.loginExpiryTs = '30 days';
                var token = jwt.sign({
                    data: payload,
                }, JWT_KEY, {
                    expiresIn: '30 days'
                });



                return res.status(200).send({
                    success: 1,
                    token,
                    userInfo: payload,
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



exports.search = async (req, res) => {


    let userDataz = req.identity.data;

    let query = req.query;


    var page = query.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(query.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };


    if (!query) {
        return res.send({
            sucess: 0,
            msg: "did not find any parameters"
        });
    }


    var findCriteria = {};

    if (query.keyword) {
        var search = query.keyword;
        findCriteria = {
            _id: {
                $regex: search,
                $options: 'i',
            }
        };

    }





    if (!query.status) {
        return res.send({
            success: 0,
            message: "please specify status "
        })
    }
    if (query.status == "assigned") {
        findCriteria.deliveryStatus = "assigned";
    }

    if (query.status == "accepted") {
        findCriteria.deliveryStatus = "accepted";
    }
    if (query.status == "picked") {
        findCriteria.deliveryStatus = "picked";
    }
    if (query.status == "delivered") {
        findCriteria.deliveryStatus = "delivered";
    }





    let cartData = await CartModel.find(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'unknown error',
                error: err
            }
        })

    if (cartData && cartData.success && (cartData.success === 0)) {
        return res.send({
            success: 0,
            message: "DB error"
        });
    }

    // return res.send(cartData);
    if (!cartData) {
        return res.status(200).send({
            success: 0,
            message: 'orders not exists'
        });
    };
    var objectArray = [];
    for (x in cartData) {

        let address = await addressModel.findOne({ _id: cartData[x].deliveryAddress }, { addressLane: 1, phone: 1, city: 1, name: 1, pin: 1 })
            .catch(err => {
                return {
                    success: 0,
                    message: 'unknown error',
                    error: err
                }
            })

        if (address && address.success && (address.success === 0)) {
            continue;
        }
        if (!address) {
            continue;
        }


        let object = {};
        object.id = cartData[x]._id;
        object.deliveryTime = cartData[x].deliveredAt;
        object.pickingTime = cartData[x].pickedAt;
        object.address = address;
        objectArray.push(object);
    }

    if (objectArray.length == 0) {
        return res.send({
            success: 0,

            message: "order list is empty"
        })
    }
    var itemsCount = await CartModel.countDocuments(findCriteria).catch(err => {
        return {
            success: 0,
            message: 'Something went wrong while checking phone',
            error: err
        }
    });
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    let pageNum = Number(page) || "";
    let contentPage = Number(perPage) || "";
    var pagination = {
        page: pageNum,
        perPage: contentPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }

    return res.send({
        success: 1,
        orders: objectArray,
        pagination,
        message: "listed orders"
    })






}

exports.pushToVendorHistory = async (order,userId) => {

    console.log(order);

    let orderData = await CartModel.findOne({_id:order,status:1},{products:1}).catch(err=>{
        return {
            success:0,
            message:"error in finding order from order table"
        }
    });
    if (orderData && orderData.success && orderData.success == 0){
        return 
    }
    if (!orderData){
        return
    }
    var isProductsFromSellerExists = false;
    
    for (x in orderData.products){
        let product = orderData.products[x];
        let seller = product.shopOwnerId;
        
        let sellerData = await VendorModel.findOne({_id:seller,status:1}).catch(err=>{
            return {
                success:0,
                message:"error in finding vendor from order data"
            }
        })

        if (sellerData && sellerData.success && sellerData.success == 0){
            continue
        }
        if (!sellerData){
            continue
        }
        else {
            isProductsFromSellerExists = true 
        }

        if (isProductsFromSellerExists == true){
            var orderObject = {};
            orderObject.product = {};
            orderObject.orderId = order;
            console.log(product);
            orderObject.customerId = userId;
            orderObject.tsDeliveredAt = Date.now();
            orderObject.product.productId = product.productId;
            orderObject.product.quantity = product.quantity;
            orderObject.product.price = product.price;
            orderObject.product.totalPrice =  product.totalPrice;
            if (product.isVariant == true){
                orderObject.product.variant = product.variantId
            }
        }

        let sellerDataModified = await VendorModel.updateOne({_id:seller,status:1},{ $push: { orderHistory: orderObject } }).catch(err=>{
            return {
                success:0,
                message:"did not update the seller data"
            }
        })
    }
    
}