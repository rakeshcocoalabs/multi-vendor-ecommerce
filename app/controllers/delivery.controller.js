var CartModel = require('../models/cart.model');
var AddressModel = require('../models/address.model');
var AgentModel = require('../models/agent.model');
var OTPModel = require('../models/otp.model');
const jwt = require('jsonwebtoken');
const paramsConfig = require('../../config/app.config');

exports.login = async (req, res) => {
    let params = req.body;
    let mobile = params.mobile;

    let agent = await AgentModel.findOne({
            mobile: mobile
        })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })
    if (!agent) {
        return res.send({
            success: 0,
            message: "Agent not registered"
        })
    }

    let code = 1234
    var id = agent._id;
    try {
        const Code = new OTPModel({
            status: 1,
            code: code,
            agent: agent._id
        });
        var savecode = await Code.save();
    } catch (err) {
        return res.status(500).send({
            success: 0,
            message: err.message
        })
    }
    return res.send({
        success: 1,
        id: id,
        message: "OTP Send please verify"
    })


}

exports.verifyOtp = async (req, res) => {
    let params = req.body;
    let code = params.code;
    let id = params.id;

    let agent = await OTPModel.findOne({
            code: code,
            agent: id
        })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })
    if (!agent) {
        return res.send({
            success: 0,
            message: "Agent not registered"
        })
    }

    const JWT_KEY = paramsConfig.development.jwt.secret;
    let payload = {};
    payload.mobile = params.mobile;
    payload.code = code;
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

        message: 'Successfully logged in'
    })



}

exports.list = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let findCriteria = {};

    var orders = [];
    var address = [];
    var owners = [];
    findCriteria.status = 1;

    // pagination 

    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || feedsConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : feedsConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };


    let cart = await CartModel.find(findCriteria, {
            owner: 1,

        }, pageParams).limit(perPage).sort({
            'tsCreated': -1
        })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })


    for (i in cart) {
        orders.push(cart[i]._id);

        let address = await AddressModel.find({
                owner: cart[i].owner
            }, {
                owner: 0,
                tSCreatedAt: 0,
                tSModifiedAt: 0,
                __v: 0

            })
            .catch(err => {
                return {
                    success: 0,
                    message: 'did not get cart for the user',
                    error: err
                }
            })

        owners.push(address);
    }

    var itemsCount = await CartModel.countDocuments(findCriteria);
    totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }

    return res.send({
        success: 1,
        orders: orders,
        address: owners
    })

}

exports.assign = async (req, res) => {
    let findCriteria = {};
    let params = req.body;

    if (!params.id) {
        return res.send({
            success: 0,
            message: "select an order"
        })
    }

    findCriteria.status = 1;

    findCriteria._id = params.id;


    let cart = await CartModel.updateOne(findCriteria, {
            assignee: params.userid,
            delivery_status: "Assigned",
            assigned_at: (new Date()).getTime()
        })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })



    if (cart) {
        return res.send({
            success: 1,
            message: "Successfully assigned"
        })

    }
}

exports.picked = async (req, res) => {

    let findCriteria = {};

    let params = req.body;

    if (!params.id) {
        return res.send({
            success: 0,
            message: "select an order"
        })
    }

    findCriteria.status = 1;

    findCriteria._id = params.id;


    let cart = await CartModel.updateOne(findCriteria, {
            assignee: params.userid,
            delivery_status: "Picked",
            picked_at: (new Date()).getTime()
        })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })



    if (cart) {
        return res.send({
            success: 1,
            message: "Successfully assigned"
        })

    }
}
exports.delivered = async (req, res) => {

    let findCriteria = {};

    let params = req.body;

    if (!params.id) {
        return res.send({
            success: 0,
            message: "select an order"
        })
    }

    findCriteria.status = 1;

    findCriteria._id = params.id;


    let cart = await CartModel.updateOne(findCriteria, {
            assignee: params.userid,
            delivery_status: "Delivered",
            delivered_at: (new Date()).getTime()
        })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })



    if (cart) {
        return res.send({
            success: 1,
            message: "Successfully changed status"
        })

    }
}