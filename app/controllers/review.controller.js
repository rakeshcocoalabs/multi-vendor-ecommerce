var stringify = require('json-stringify-safe');
var ReviewModel = require('../models/review.model');
var UserModel = require('../models/user.model');
const paramsConfig = require('../../config/app.config');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
var otpConfig = paramsConfig.otp;

exports.create = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    if (!params) {
        return res.send({
            success: 0,
            "message": "did not recieved any parameters"
        });
    }
    if (!params.review_message) {
        return res.send({
            success: 0,
            "message": "did not recieved any review messages"
        });
    }
    if (!params.product) {
        return res.send({
            success: 0,
            "message": "did not recieved product id"
        });
    }

    let user = await userModel.findOne({ _id: userId }, { name: 1, image: 1 }).catch(err => {
        return {
            success: 0,
            message: "DB error"
        }
    }
    );
    if (user && user.success && user.success == 0) {
        return res.send({
            success: 0,
            message: "DB error"
        })
    }
    let shop = await productModel.findOne({ _id: params.product }, { shopOwnerId: 1 }).catch(err => {
        return {
            success: 0,
            message: "DB error"
        }
    }
    );
    if (shop && shop.success && shop.success == 0) {
        return res.send({
            success: 0,
            message: "DB error"
        })
    }
    try {
        const review = new ReviewModel({
            status: 1,
            content: params.review_message,
            user: {
                name: user.name,
                avatar: user.image || "placeholder.jpg",
            },
            sellerId: shop._id,
        
            productId: params.product,
            rating: params.rating,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        var save_review = await review.save();
        return res.send({
            success: 1,
            message: "review added successfully"
        })
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}

exports.list = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.query;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };

    let findCriteria = {};

    findCriteria.status = 1;

    findCriteria.productId = params.product;

    let projection = {};

    projection.content = 1;
    projection.user = 1;
    projection.tsCreatedAt = 1;
    projection.rating = 1;




    let data = await ReviewModel.find(findCriteria, projection, pageParams).sort({
        'tsCreatedAt': -1
    })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    var itemsCount = await ReviewModel.countDocuments(findCriteria);
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
    if (data) {

        return res.send({
            success: 1,
            pagination,
            items: data,
            message: "review listed"
        })
    }


}
