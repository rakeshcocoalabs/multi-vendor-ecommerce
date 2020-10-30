var CategoryModel = require('../models/categories.model');
const config = require('../../config/app.config');
const categoryConfig = config.categories;

exports.create = async (req, res) => {
    var file = req.file;
    var name = req.body.name;
    if (!name || !file) {
        var errors = [];
        if (!name) {
            errors.push({
                field: 'name',
                message: 'name cannot be empty'
            })
        }
        if (!file) {
            errors.push({
                field: 'iconImage',
                message: 'iconImage cannot be empty'
            })
        }
        return res.status(400).send({
            success: 0,
            message: errors
        })
    }
    var fileName = file.filename;
    name = name.trim();
    var checkCategoryName = await CategoryModel.find({
        name: name,
        status: 1
    });
    if (checkCategoryName.length > 0) {
        return res.status(400).send({
            success: 0,
            message: 'Category name exists'
        })
    }
    try {
        const newCategory = new CategoryModel({
            name: name,
            image: fileName,
            status: 1,
            tsCreatedAt: Date.now(),
            tsModifiedAt: null
        });
        var addCategory = await newCategory.save();
        res.status(200).send({
            success: 1,
            id: addCategory._id,
            message: 'Category added successfully'
        });
    } catch (err) {
        res.status(500).send({
            success: 1,
            message: err.message
        });
    }
}

exports.list = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let findCriteria = {};

    findCriteria.status = 1;

    let projection = {};


    projection.image = 1,
        projection.name = 1,
        projection._id = 1
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


    let categoryData = await CategoryModel.find(findCriteria, projection, pageParams)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })


    var itemsCount = await CategoryModel.countDocuments(findCriteria);
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
    if (categoryData && categoryData.success && categoryData.success === 0) {
        return res.send({
            success: 0,
            message: "Db error"
        })

    }
    else {
        if (categoryData.length == 0) {
            if (page == 1) {
                return res.send({
                    success: 0,
                    message: "No items to shoCategoryw"
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
            message: "Listing Categories",
            categoryImageBase: categoryConfig.imageBase,
            items: categoryData
        })
    }


}

exports.update = async (req, res) => {
    let userDataz = req.identity.data;
    var files = req.file;
    let params = req.body;

    let id = req.params.id;
    let findCriteria = {};
    findCriteria._id = id;
    findCriteria.status = 1;

    let update = {};


    if (params) {
        if (params.name) {
            update.name = params.name
        }
    }

    if (files) {
        var fileName = files.filename;
        update.image = fileName;
        console.log("break point")
    }

    if (update == null) {
        return res.send({
                success: 0,
                message: "nothing to update"
            }
        )
    }
    else {
        update.tsModifiedAt = Date.now()
    }
 
    await this.checkExistData(res, findCriteria)

    let Data = await CategoryModel.updateOne(findCriteria, update)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while updating category',
                error: err
            }
        })

    if (Data && Data.success && Data.success == 0) {
        return res.send(Data)
    }

    if (Data) {
        return res.send({
            success: 1,
            message: "category updated successfully"
        })
    }
}
exports.delete = async (req, res) => {
    let userDataz = req.identity.data;




    let findCriteria = {};
    findCriteria._id = req.params.id;
    findCriteria.status = 1;

    let update = {
        status: 0
    };

    this.checkExistData(res, findCriteria)


    let Data = await CategoryModel.updateOne(findCriteria, update)
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

            message: "category removed successfully"
        })
    }
    else {
        return res.send({
            success: 0,

            message: "DB error"
        })
    }
}

exports.details = async (req, res) => {
    let userDataz = req.identity.data;



    let findCriteria = {};
    findCriteria._id = req.params.id;
    findCriteria.status = 1;



    //this.checkExistData(res,findCriteria)


    let Data = await CategoryModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while fetching category data',
                error: err
            }
        })

    if (Data && Data.success && Data.success == 0) {
        return res.send(Data)
    }


    if (Data) {

        return res.send({
            success: 1,
            Data,
            categoryImageBase: categoryConfig.imageBase,
            message: "category details successfully"
        })
    }
    else {
        return res.send({
            success: 0,

            message: "did not find category"
        })
    }
}


exports.checkExistData = async (res, condition) => {

    let Data = await CategoryModel.findOne(condition).catch(err => {

        return {
            success: 0,
            message: "something wenr wrong on identifying category"
        }
    })

    if (Data && Data.success && Data.success == 0) {
        return res.send(Data)
    }
    if (!Data) {
        return res.send({
            success: 0,
            message: "no such category exists"
        })
    }


}