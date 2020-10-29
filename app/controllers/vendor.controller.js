var stringify = require('json-stringify-safe');
var VendorModel = require('../models/vendor.model');
var AgentModel = require('../models/deliveryAgent.model');
var ProductModel = require('../models/product.model');
var ReviewModel = require('../models/review.model');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/app.config');
const paramsConfig = require('../../config/params.config');
const vendorModel = require('../models/vendor.model');
const { products } = require('../../config/app.config');


exports.createProduct = async (req, res) => {
    var userId = req.identity.data.id;
    var files = req.files;
    var name = req.body.name;
    var qty = req.body.qty;
    var parent = req.body.parent;
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
        if (!parent) {
            errors.push({
                field: 'parent',
                message: 'parent cannot be empty'
            })
        }
        if (!description) {
            errors.push({
                field: 'description',
                message: 'description cannot be empty'
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
            //parent:params.parent,
            expiryDate:params.expiryDate || 0,
            manufacturingDate:params.manufacturingDate || 0,
            serialNumber:params.serialNumber || 0,
            shopOwnerId:userId,
            productNo:(Date.now()).toString(),
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


exports.addProduct = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;

    


    if (!params.name) {
        return res.send({
            success: 0,
            msg: "name not provided"
        })
    }
    if (!params.category) {
        return res.send({
            success: 0,
            msg: "category not provided"
        })
    }

    if (!params.price) {
        return res.send({
            success: 0,
            msg: "prie not provided"
        })
    }
    if (!params.qty) {
        return res.send({
            success: 0,
            msg: "quantity not provided"
        })
    }
    if (params.discount > 99) {
        return res.send({
            success: 0,
            msg: "discount is not feasible"
        })
    }


    const last = await ProductModel.find({}).sort({
        _id: -1
    }).limit(1);

    const lastid = last[0].id || 0;
    const new_id = lastid + 1;
    var formattedNumber_id = ("0" + new_id).slice(-2);
    const new_sku = params.parent + "_" + formattedNumber_id + "_" + userId;



    try {



        const Prod = new ProductModel({
            status: 1,
            name: params.name,
            description: params.description,
            qty: params.qty,
            category: params.category,
            discount: params.discount || 0,
            price: params.price,
            meter: params.meter,
            variants_exists: params.variantsAvailable,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null,


            id: new_id,
            sku: new_sku,
            currency: params.currency || "INR",
            rebate_price: params.rebated_price,
            isActive: true,
            isFeaturedNew: params.isnew || false,
            inPromotion: params.ispromoted || false,
            parentProductId: 0,
            numberRemaining: params.qty,
            numberSold: 0,
            avaregeRating: 0
        });
        var prod = await Prod.save();

        if (prod) {
            if (params.variantsAvailable && params.array && prod._id) {
                await addVariantProduct(params.array, prod._id)
            }
        }


        return res.status(200).send({
            success: 1,
            id: prod._id,

            message: 'Product tSCreatedAt successfully'
        });


    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }


}


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
    projectCriteria._id = 1

    var data = await VendorModel.findOne(findCriteria, projectCriteria)
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
        profile: data
    });
}

exports.add_devivery_agent = async (req, res) => {
    var params = req.body;


    if (!params) {
        return res.send({
            success: 0,
            msg: "did not recieved any parameters"
        });
    }

    if (!params.email) {
        return res.send({
            success: 0,
            msg: "did not recieved email"
        });
    }
    if (!params.name) {
        return res.send({
            success: 0,
            msg: "did not recieved name"
        });
    }
    if (!params.password) {
        return res.send({
            success: 0,
            msg: "did not recieved password"
        });
    }
    if (!params.mobile) {
        return res.send({
            success: 0,
            msg: "did not recieved mobile"
        });
    }

    let findCriteria = {};

    findCriteria.mobile = params.mobile;
    findCriteria.status = 1;

    let userData = await AgentModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (userData) {

        return res.send({
            msg: "mobile already registered by some one"
        })
    }

    try {

        const salt = bcrypt.genSaltSync(10);
        const passHash = bcrypt.hashSync(params.password, salt);

        const User = new AgentModel({
            status: 1,
            name: params.name,
            email: params.email,
            mobile: params.mobile,
            passwordHash: passHash,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        var saveuser = await User.save();




        return res.status(200).send({
            success: 1,
            id: saveuser._id,

            message: 'Profile tSCreatedAt successfully'
        });


    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message
        })
    }
}

exports.create = async (req, res) => {
    var params = req.body;


    if (!params) {
        return res.send({
            success: 0,
            msg: "did not recieved any parameters"
        });
    }

    if (!params.email) {
        return res.send({
            success: 0,
            msg: "did not recieved email"
        });
    }
    if (!params.name) {
        return res.send({
            success: 0,
            msg: "did not recieved name"
        });
    }
    if (!params.password) {
        return res.send({
            success: 0,
            msg: "did not recieved password"
        });
    }
    if (!params.mobile) {
        return res.send({
            success: 0,
            msg: "did not recieved mobile"
        });
    }

    let findCriteria = {};

    findCriteria.email = params.email;
    findCriteria.status = 1;

    let userData = await VendorModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (userData) {

        return res.send({
            msg: "email already taken by some one"
        })
    }

    try {

        const salt = bcrypt.genSaltSync(10);
        const passHash = bcrypt.hashSync(params.password, salt);

        const User = new VendorModel({
            status: 1,
            name: params.name,
            email: params.email,
            mobile: params.mobile,
            passwordHash: passHash,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        var saveuser = await User.save();




        return res.status(200).send({
            success: 1,
            id: saveuser._id,

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


    let userData = await VendorModel.findOne(findCriteria)
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
        const JWT_KEY = paramsConfig.development.jwt.secret;
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
            superuser: 1,
            userDetails: {
                name: payload.name,
                id: payload.id
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

    findCriteria.shopOwnerId = userDataz.id;

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
    //projection.category = 1;
    projection.stockAvailable = 1;



    let Data = await ProductModel.find(findCriteria, projection, pageParams).populate({path:'category',select:"name"})
        .sort(sort)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

     



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
            
            items: Data,
            pagination,
            message: "search results listed"
        })
    }

}


exports.updateProduct = async (req, res) => {

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
        return {
            success:0,
            message:"DB error",
        
        };
    });

    if (updated && updated.success && update.success === 0){
        return res.send({
            success:0,
            message:"DB error"
        })
    }

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

exports.deleteProduct = async (req, res) => {

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
        msg: " deleted"
    })


}


exports.reviewlist = async (req, res) => {

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

    findCriteria.shopOwnerId = userId;

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


exports.getDashBoard = async (req,res) => {

    let userId = req.identity.data.id;

    let vendorData = await VendorModel.findOne({status:1,_id:userId}).catch(err=> {
        return {
            success:0,
            message:"did not get data from vendor model"
        }
    })
    if (vendorData && vendorData.success && vendorData.success == 0){
        return ({
            success:0,
            message:"did not get data from vendor model"
        })
    }
    if (!vendorData){
        return res.send({
            success:0,
            message:"return null value"
        })
    }

    var sum = 0.0;
    var totalItems = 0;
    for (x in vendorData.orderHistory){

        let order = vendorData.orderHistory[x]
        let product = order.product
        
        if(product){
            if (product.totalPrice){
                sum = sum + product.totalPrice;
            }
            else {
                continue
            }
            if (product.quantity){
                totalItems = totalItems + product.quantity;
            }
            else {
                continue
            }
        }
        else {
            continue
        }

    }
    var totalProductCount = 0;
    let productData = await ProductModel.countDocuments({shopOwnerId:userId,status:1}).catch(err=> {
        return {
            success:0,
            message:"did not get data from product model"
        }
    })
    
    if (productData){

        totalProductCount = productData
        
    }

    return res.send({
        message:"dashboard detail",
        success:0,
        sum,
        totalItems,
        totalProducts:totalProductCount
    });
}

exports.stockList = async (req, res) => {
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

    findCriteria.shopOwnerId = userDataz.id;

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

    // if (params.category) {
    //     findCriteria.category = params.category;
    // }
    // if (params.brand) {
    //     findCriteria.brand = params.brand;
    // }
    // if (params.price_range) {
    //     findCriteria.sellingPrice = {
    //         $gt: params.lowerprice,
    //         $lt: params.upperprice
    //     }
    // }

    // findCriteria.status = 1;

    // var sort = {};
    // if (params.sort) {
    //     if (params.sort == "priceHighToLow") {
    //         sort = { "sellingPrice": -1 }
    //     }
    //     if (params.sort == "priceLowToHigh") {
    //         sort = { "sellingPrice": 1 }
    //     }
    //     if (params.sort == "highestRated") {

    //         sort = { 'avaregeRating': -1 }
    //     }
    // }







    let projection = {};


    projection.serialNumber = 1;
    projection.name = 1;
    projection.manufacturingDate = 1;
    projection.expiryDate = 1;
    projection.productNo = 1;
    projection.stockAvailable = 1;



    let Data = await ProductModel.find(findCriteria, projection, pageParams).populate({path:'category',select:"name"})
        .sort(sort)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

     



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
            
            items: Data,
            pagination,
            message: "search results listed"
        })
    }

}