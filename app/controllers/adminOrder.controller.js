var OrderModel = require('../models/cart.model');
var UserModel = require('../models/user.model');
const config = require('../../config/app.config');
const categoryConfig = config.categories;




exports.list = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let findCriteria = {};

    findCriteria.status = 1;

    let projection = {};

    projection.orderNo = 1;
    projection.userId = 1;
    projection.paymentMethod = 1;
    projection.orderDate = 1;
    projection.grandTotal = 1;
    
    projection.orderStatus = 1;

    var params = req.query;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };


    let orderData = await OrderModel.find(findCriteria, projection, pageParams).populate({path:'userId',select:'name'}).catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })


    var itemsCount = await OrderModel.countDocuments(findCriteria);
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
    if (orderData && orderData.success && orderData.success === 0) {
        return res.send({
            success: 0,
            message: "Db error"
        })

    }
    else {
        if (orderData.length == 0) {
            if (page == 1) {
                return res.send({
                    success: 0,
                    message: "No items to show"
                })
            } else {

               

                return res.send({
                    success: 0,
                    message: "No more items to show"
                })
            }
        }

        
        
           
        return res.send({
            success: 1,
            pagination,
            message: "Listing orders",
           
            items: orderData
        })
    }


}
exports.update = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;




    if ((!req.params)) {
        return res.send({
            success: 0,
            msg: "id not  provided"
        })
    }
    if ((!params.status)) {
        return res.send({
            success: 0,
            msg: "status not  provided"
        })
    }


    var update = {
        orderStatus:params.status
    };

    


   
    var updated = await OrderModel.updateOne({
        _id: req.params.id
    },
        update
    ).catch(err => {
        return res.send({
            success: 0,
            msg: err.message
        })
    });

    if (!updated) {
        return res.send({
            success: 0,
            msg: "did not updated"
        })
    }

    return res.send({
        success: 1,
        msg: " updated"
    })


}

exports.delete = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.params;





    var update = {
        status: 0
    };
    if (update == null) {
        return res.send({
            success: 0,
            msg: "no update provided"
        })
    }

    var updated = await ProductModel.updateOne({
        _id: params.id
    },
        update
    ).catch(err => {
        return 5;
    });

    if (!updated) {
        return res.send({
            success: 0,
            msg: "did not updated"
        })
    }

    return res.send({
        success: 1,
        msg: " updated"
    })


}