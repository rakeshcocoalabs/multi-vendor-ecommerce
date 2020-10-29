var AddressModel = require('../models/address.model');
var config = require('../../config/app.config');
var feedsConfig = config.feeds;
exports.create = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    try {
        const address = new AddressModel({
            status: 1,
            addressLane: params.addressLane,
            phone:params.phone,
            name:params.name,
            city: params.city,
            pin: params.pin,
            owner: userId,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null,
        });
        var addressobject = await address.save();
        return res.status(200).send({
            success: 1,
            id: addressobject._id,
            message: 'address tSCreatedAt successfully'
        });
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
    let findCriteria = {};
    findCriteria.owner = userId;
    findCriteria.status = 1;
    var params = req.query;
 
    // pagination 
    //return res.send(params);
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };
    let projection = {};
    projection.addressLane = 1,
        projection.name = 1,
        projection.phone = 1,
        projection.pin = 1,
        projection.city = 1,
        projection.default = 1


    let categoryData = await AddressModel.find(findCriteria, projection, pageParams).limit(perPage).sort({
            'tsCreatedAt': -1
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    var itemsCount = await AddressModel.countDocuments(findCriteria);
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
    if (categoryData) {

        return res.send({
            success: 1,
            pagination,
            items: categoryData,
            message: "address list"
        })
    }


}

exports.setdefault = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    let id = params.id;
    let findCriteria = {};
    findCriteria.owner = userId;
    findCriteria.default = true

    let projection = {};

    projection.line_1 = 1,
        projection.line_2 = 1,
        projection.pin = 1,
        projection.city = 1,
        projection.default = 1


    let Data = await AddressModel.updateOne(findCriteria, {
            default: false
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    let findCriteria1 = {};
    findCriteria1.owner = userId;
    findCriteria1._id = id;


    let Data1 = await AddressModel.updateOne(findCriteria1, {
            default: true
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (Data1) {

        return res.send({
            success: 1,
            message: "address updated successfully"
        })
    }
}


exports.remove = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    let id = params.id;
    if (!params.id){
        return res.send({
            success:0,
            message:"mention id"
        })
    }
    let findCriteria = {};
    findCriteria._id = params.id;
    findCriteria.status = 1;

    let update = {
        status:0
    };

   

    let Data = await AddressModel.updateOne(findCriteria, update)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    
    if (Data) {

        return res.send({
            success: 1,
            message: "address removed successfully"
        })
    }
}

exports.update = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    
    let findCriteria = {};
    findCriteria._id = params.id;
    findCriteria.status = 1;

    if (!params.id){
        return res.send({
            success:0,
            message:"mention id"
        })
    }
    if(!params.addressLane && !params.phone && !params.city && !params.city && !params.pin && !params.name){
        return res.send({
            success:0,
            message:"Nothing to update"
        })
    }
    let update = {};

    if (params.addressLane){
        update.addressLane = params.addressLane
    }
    if (params.phone){
        update.phone = params.phone
    }
    if (params.city){
        update.city = params.city
    }
    if (params.pin){
        update.pin = params.pin
    }
    if(params.name){
        update.name = params.name
    }
    console.log("findCriteria")
    console.log(findCriteria)
    console.log("findCriteria")
    console.log("update")
    console.log(update)
    console.log("update")
    let updateAddress = await AddressModel.updateOne(findCriteria, update)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while updating address',
                error: err
            }
        })
      

    if (updateAddress && (updateAddress.success !== undefined) && (updateAddress.success === 0)) {
        return res.send(updateAddress);
    }
        return res.send({
            success: 1,
            message: "address updated successfully"
        })
}