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
            iconImage: fileName,
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
};



exports.list = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let findCriteria = {};

    findCriteria.status = 1;

    let projection = {};


    projection.image = 1,
        projection.name = 1,
        projection._id = 1


    let categoryData = await CategoryModel.find(findCriteria, projection)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (categoryData) {

        return res.send({
            success: 1,
            categoryImageBase:categoryConfig.imageBase,
            items: categoryData
        })
    }


}

exports.subcategories = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    let findCriteria = {};

    findCriteria.status = 1;
    findCriteria.parent = params.parent;

    let projection = {};


    projection.image = 1,
        projection.name = 1,
        projection._id = 1


    let categoryData = await CategoryModel.find(findCriteria, projection)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (categoryData) {

        return res.send({
            success: 1,
            items: categoryData
        })
    }


}


exports.create1 = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;

    const user = await EmpModel.findOne({
        _id: userId,
        status: 1
    }, {
        superUser: 1,
        permissions: 1,
        _id: 0
    }).catch(err => {
        return res.send({
            success: 0,
            msg: "Could not access db"
        })
    })

    if (user.superUser == 2 && user.permissions.product == 2) {
        return res.send({
            success: 0,
            msg: "user not authorised"
        })
    }


    if (!params.name) {
        return res.send({
            success: 0,
            msg: "name not provided"
        })
    }

    try {
        const Category = new CategoryModel({
            status: 1,
            name: params.name,
            description: params.description,
            category: params.category || null,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null,
        });
        var category = await Category.save();

        if (category) {
            return res.status(200).send({
                success: 1,
                id: category._id,

                message: 'Product tSCreatedAt successfully'
            });

        }
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }


}