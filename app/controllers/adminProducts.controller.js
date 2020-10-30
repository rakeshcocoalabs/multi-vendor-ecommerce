
const config = require('../../config/app.config');
const ProductModel = require('../models/product.model');

const paramsConfig = require('../../config/params.config');
var CategoryModel = require('../models/categories.model');
var VariantModel = require('../models/variant.model');
const categoryConfig = config.categories;
const variantConfig = config.variants;



const productsConfig = config.products;


exports.create = async (req, res) => {
    var files = req.files;
    var name = req.body.name;
    var qty = req.body.qty;
    var sellingPrice = req.body.sellingPrice;
    var description = req.body.description;
    var costPrice = req.body.costPrice;
    if (!name || !files || !qty || !sellingPrice || !costPrice || !description) {
        var errors = [];
        if (!name) {
            errors.push({
                field: 'name',
                message: 'name cannot be empty'
            })
        }
        if (!qty) {
            errors.push({
                field: 'quantity',
                message: 'quantity cannot be empty'
            })
        }
        if (!sellingPrice) {
            errors.push({
                field: 'sellingPrice',
                message: 'sellingPrice cannot be empty'
            })
        }
        if (!costPrice) {
            errors.push({
                field: 'costPrice',
                message: 'costPrice cannot be empty'
            })
        }
        if (!files) {
            errors.push({
                field: 'images',
                message: 'images cannot be empty'
            })
        }
        return res.status(400).send({
            success: 0,
            message: errors
        })
    }
    var params = req.body;
    var fileNames = files.filenames;

    var files = req.files;
    var images = [];
    if (files) {
        if (files.images && files.images.length > 0) {
            var len = files.images.length;
            var i = 0;
            while (i < len) {
                images.push(files.images[i].filename);
                i++;
            }
        }
    }
    name = name.trim();
    var checkProductName = await ProductModel.find({
        name: name,
        status: 1
    });
    if (checkProductName.length > 0) {
        return res.status(400).send({
            success: 0,
            message: 'Product name exists'
        })
    }
    try {
        const newProduct = new ProductModel({
            name: name,
            image: images,
            status: 1,
            category: params.category,
            sellingPrice: params.sellingPrice,
            costPrice: params.costPrice,
        
            stockAvailable: params.qty,
            description: params.description,
            variantsExist: params.variantsExist || false,
            tsCreatedAt: Date.now(),
            tsModifiedAt: null
        });
        var addProducts = await newProduct.save();
        res.status(200).send({
            success: 1,
            id: addProducts._id,
            message: 'Product added successfully'
        });
    } catch (err) {
        res.status(500).send({
            success: 1,
            message: err.message
        });
    }
}



exports.search = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    let query = req.query;


    var page = query.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(query.perPage) || config.products.resultsPerPage;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };


    if (!params) {
        return res.send({
            sucess: 0,
            msg: "did not find any parameters"
        });
    }


    var findCriteria = {};

    if (params.word) {
        var search = params.word;
        findCriteria = {
            $or: [{
                name: {
                    $regex: search,
                    $options: 'i',
                }
            }, {
                description: {
                    $regex: search,
                    $options: 'i'
                }
            }]
        };
    }

    if (params.category) {
        findCriteria.category = params.category;
    }
    if (params.brand) {
        findCriteria.brand = params.brand;
    }
    if (params.price_range) {
        findCriteria.sellingPrice = {
            $gt: params.lowerprice,
            $lt: params.upperprice
        }
    }

    findCriteria.status = 1;

    var sort = {};
    if (params.sort) {
        if (params.sort == "priceHighToLow") {
            sort = { "sellingPrice": -1 }
        }
        if (params.sort == "priceLowToHigh") {
            sort = { "sellingPrice": 1 }
        }
        if (params.sort == "highestRated") {

            sort = { 'avaregeRating': -1 }
        }
    }







    let projection = {};


    projection.image = 1;
    projection.name = 1;
    projection.sellingPrice = 1;
    projection.costPrice = 1;
    projection.description = 1;
    projection.avaregeRating = 1;
    projection.category = 1;
    projection.stockAvailable = 1;



    let Data = await ProductModel.find(findCriteria, projection, pageParams)
        .sort(sort)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    var objectArray = [];
    for (x in Data) {

        let product = Data[x];

        let object = {};

        // object.image = product.image;

        object.name = product.name;

        object.id = product._id;

        object.costPrice = product.costPrice;

        object.sellingPrice = product.sellingPrice;

        object.quantity = product.stockAvailable;

        var categoryData = await CategoryModel.findOne({ _id: product.category }).catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        });

        if (!categoryData) {
            object.category = "category";
        }
        else {

            object.category = categoryData.name;
        }

        objectArray.push(object)
    }




    var itemsCount = await ProductModel.countDocuments(findCriteria).catch(err => {
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
    if (Data && Data.success && Data.success === 0) {
        return res.send({
            success: 0,
            message: "Database error"
        })

    }
    else {

        if (pageNum == 1) {
            if (Data.length == 0) {
                return res.send({
                    success: 0,

                    message: "no matching results"
                })
            }
        }
        else {
            if (Data.length == 0) {
                return res.send({
                    success: 0,

                    message: "end of results"
                })
            }
        }



        return res.send({
            success: 1,
            imageBase: productsConfig.imageBase,
            items: objectArray,
            pagination,
            message: "search results listed"
        })
    }

}


exports.update = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;




    if ((!params.id)) {
        return res.send({
            success: 0,
            msg: "id not  provided"
        })
    }

    var update = {};

    if (params.category) {
        update.category = params.category;
    }
    if (params.costPrice) {
        update.costPrice = params.costPrice;
    }
    if (params.sellingPrice) {
        update.sellingPrice = params.sellingPrice;
    }
    if (params.description) {
        update.description = params.description;
    }
    if (params.name) {
        var checkProductName = await ProductModel.countDocuments({
            name: params.name,
            status: 1
        });
        if (checkProductName > 0) {
            return res.status(400).send({
                success: 0,
                message: 'Product name exists'
            })
        }
        update.name = params.name;
    }


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


exports.addVariant = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    if (!params.productId && !params.size || !params.stockAvailable || !params.costPrice || !params.sellingPrice
        || !params.currency || !params.unit) {
        var message = "";
        if (!params.size) {
            errors.push({
                field: "size",
                message: "Require size"
            });
            message = "Require size";
        }
        if (!params.stockAvailable) {
            errors.push({
                field: "stockAvailable",
                message: "Require stockAvailable"
            });
            message = "Require stockAvailable";
        }
        if (!params.costPrice) {
            errors.push({
                field: "costPrice",
                message: "Require costPrice"
            });
            message = "Require costPrice";
        }
        if (!params.sellingPrice) {
            errors.push({
                field: "sellingPrice",
                message: "Require sellingPrice"
            });
            message = "Require sellingPrice";
        }
        if (!params.currency) {
            errors.push({
                field: "currency",
                message: "Require currency"
            });
            message = "Require currency";
        }
        if (!params.unit) {
            errors.push({
                field: "unit",
                message: "Require unit"
            });
            message = "Require unit";
        }
        if (!params.productId) {
            errors.push({
                field: "productId",
                message: "Require productId"
            });
            message = "Require productId";
        }
        return res.send({
            success: 0,
            statusCode: 400,
            message,
            errors: errors,
        });
    }
    var productId = params.productId;
    var findCriteria = {
        _id: productId,
        status: 1
    }
    var productData = await ProductModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking product',
                error: err
            }
        })
    if (productData && productData.success && (productData.success === 0)) {
        return res.send(productData);
    }
    if (productData) {
        if (productData.variantsExists) {
            var variantObj = {};
            variantObj.size = params.size;
            variantObj.parent = productId;
            variantObj.stockAvailable = params.stockAvailable;
            variantObj.costPrice = params.costPrice;
            variantObj.sellingPrice = params.sellingPrice;
            variantObj.isAvailable = true;
            variantObj.currency = params.currency;
            variantObj.unit = params.unit;
            variantObj.status = 1;
            variantObj.tsCreatedAt = Date.now();
            variantObj.tsModifiedAt = null;

            var newVariantObj = new VariantModel(variantObj);
            var variantData = await newVariantObj.save()
                .catch(err => {
                    return {
                        success: 0,
                        message: 'Something went wrong while saving variant',
                        error: err
                    }
                })
            if (variantData && variantData.success && (variantData.success === 0)) {
                return res.send(variantData);
            }
            console.log("findCriteria")
            console.log(findCriteria)
            console.log("findCriteria")
            console.log(variantData.id)
            var updateVariant = {
                $push: {
                    variants: variantData.id
                },
            }
                updateVariant.tsModifiedAt = Date.now();

            var updateProduct = await ProductModel.updateOne(findCriteria, updateVariant)
                .catch(err => {
                    return {
                        success: 0,
                        message: 'Something went wrong while updating variant in product',
                        error: err
                    }
                })
            if (updateProduct && updateProduct.success && (updateProduct.success === 0)) {
                return res.send(updateProduct);
            }
            console.log("updateProduct")
            console.log(updateProduct)
            console.log("updateProduct")
            return res.send({
                message: "Variant added successfully",
                success: 1,
            })

        } else {
            return res.send({
                success: 0,
                message: "Product have not variant"
            })
        }

    } else {
        return res.send({
            success: 0,
            message: "Product not exists"
        })
    }
}

exports.getVariantDetail = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    var variantId = req.params.id;

    var variantData = await VariantModel.findOne({
        _id: variantId,
        status: 1
    })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting variant data',
                error: err
            }
        })
    if (variantData && variantData.success && (variantData.success === 0)) {
        return res.send(variantData);
    }
    if (variantData) {
        return res.send({
            success: 1,
            // imageBase: productsConfig.imageBase,
            item: variantData,
            message: 'Variant details'
        })
    } else {
        return res.send({
            success: 0,
            message: "Variant not exists"
        })
    }
}

exports.updateVariant = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    var variantId = req.params.id;
    var findCriteria = {
        _id: variantId,
        status: 1
    };
    var variantData = await VariantModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting variant data',
                error: err
            }
        })
    if (variantData && variantData.success && (variantData.success === 0)) {
        return res.send(variantData);
    }
    if (variantData) {
        var params = req.body;
        if (!params.size && !params.stockAvailable && !params.costPrice && !params.sellingPrice
            && !params.currency && !params.unit) {
            return res.send({
                success: 0,
                message: "Nothing to update"
            })
        }
        var update = {};
        if (params.size) {
            update.size = params.size;
        }
        if (params.stockAvailable) {
            update.stockAvailable = params.stockAvailable;
        }
        if (params.costPrice) {
            update.costPrice = params.costPrice;
        }
        if (params.sellingPrice) {
            update.sellingPrice = params.sellingPrice;
        }
        if (params.currency) {
            update.currency = params.currency;
        }
        if (params.unit) {
            update.unit = params.unit;
        }
        update.tsModifiedAt = Date.now();
        var variantUpdateData = await VariantModel.updateOne(findCriteria, update)
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while updating variant data',
                    error: err
                }
            })
        if (variantUpdateData && variantUpdateData.success && (variantUpdateData.success === 0)) {
            return res.send(variantUpdateData);
        }
        return res.send({
            success: 1,
            message: 'Variant updated successfully'
        })
    } else {
        return res.send({
            success: 0,
            message: "Variant not exists"
        })
    }
}
exports.deleteVariant = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    var variantId = req.params.id;
    var findCriteria = {
        _id: variantId,
        status: 1
    };
    var variantData = await VariantModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting variant data',
                error: err
            }
        })
    if (variantData && variantData.success && (variantData.success === 0)) {
        return res.send(variantData);
    }
    if (variantData) {
        var update = {};
        update.status = 0;
        update.tsModifiedAt = Date.now();
        var variantUpdateData = await VariantModel.updateOne(findCriteria, update)
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while removing variant',
                    error: err
                }
            })
        if (variantUpdateData && variantUpdateData.success && (variantUpdateData.success === 0)) {
            return res.send(variantUpdateData);
        }
        var updateVariant = {
            $pull: {
                variants: variantId
            },
            tsModifiedAt: Date.now()
        };


        var updateProduct = await ProductModel.updateOne({
            _id: variantData.parent,
            status: 1
        }, updateVariant)
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while removing variant in product',
                    error: err
                }
            })
        if (updateProduct && updateProduct.success && (updateProduct.success === 0)) {
            return res.send(updateProduct);
        }

        return res.send({
            success: 1,
            message: 'Variant deleted successfully'
        })
    } else {
        return res.send({
            success: 0,
            message: "Variant not exists"
        })
    }
}

exports.listVariants = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let params = req.query;
    let productId = req.params.id;

    let page = Number(params.page) || 1;
    let perPage = Number(params.perPage) || variantConfig.resultsPerPage;

    perPage = perPage > 0 ? perPage : variantConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    let findCriteria = {
        parent: productId,
        status: 1
    }
    let variantData = await VariantModel.find(findCriteria)
        .limit(perPage)
        .skip(offset)
        .sort({
            'tsCreatedAt': -1
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while listing variants',
                error: err
            }
        })
    if (variantData && (variantData.success !== undefined) && (variantData.success === 0)) {
        return res.send(variantData);
    }

    let totalVariantCount = await VariantModel.countDocuments(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting total variant count',
                error: err
            }
        })
    if (totalVariantCount && totalVariantCount.success && (totalVariantCount.success === 0)) {
        return res.send(totalVariantCount);
    }

    var totalPages = totalVariantCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page,
        perPage,
        hasNextPage,
        totalItems: totalVariantCount,
        totalPages,
    };
    return res.send({
        success: 1,
        pagination,
        // imageBase: productsConfig.imageBase,
        items: variantData,
        message: 'Variant list'
    })
}