var ProductModel = require('../models/product.model');
const Variants = require('../models/variant.model');
const Reviews = require('../models/review.model');
var EmpModel = require('../models/employee.model');
var VarModel = require('../models/variant.model');
const Category = require('../models/categories.model');
const Banner = require('../models/banner.model');

const config = require('../../config/app.config');
const userModel = require('../models/user.model');
const VendorModel = require('../models/vendor.model');
const { query } = require('express');
const childProductModel = require('../models/childProduct.model');
const bannerConfig = config.banners;
const productsConfig = config.products;
const categoriesConfig = config.categories;

// *** Product detail summary ***
exports.details = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let id = req.params.id;
    try {
        let filter = {
            _id: id,
            status: 1
        };
        let projection = {
            name: 1,
            description: 1,
            image: 1,
            sellingPrice: 1,
            costPrice: 1,
            avarege_rating: 1,
            category: 1,
            shopOwnerId:1
        };
        let productDetail = await ProductModel.findOne(filter, projection).populate({path:"shopOwnerId",select:"name"})
        if (!productDetail) {
            return res.status(200).send({
                success: 0,
                message: 'Product Id not found or deleted'
            })
        }
        let categoryId = productDetail.category;
        let totalReviews = await Reviews.find({
            productId: id,
            status: 1
        }, {
            avaregeRating: 1
        }

        );
        var sumRates = 0.0;
        for (x in totalReviews) {
            if (totalReviews[x].avaregeRating) {
                sumRates = sumRates + totalReviews[x].avaregeRating;
            }
        }



        var avgRating = (sumRates / totalReviews.length).toFixed(2);

        let filterVariants = {
            parent: id,
            isAvailable: true,
            status: 1
        };
        let variantProjection = {
            size: 1,
            costPrice: 1,
            unit: 1,
            sellingPrice: 1,
            currency: 1
        };
        let productVaraiants = await VarModel.find(filterVariants, variantProjection);
        let filterRelatedProducts = {
            category: categoryId,
            outOfStock: false,
            _id: {
                $ne: productDetail._id
            },
            status: 1
        };
        let relatedProductsProjection = {
            name: 1,
            image: 1,
            costPrice: 1,
            sellingPrice: 1
        };
        let relatedProducts = await ProductModel.find(filterRelatedProducts, relatedProductsProjection).limit(5);

        var objectArray = [];
        for (x in relatedProducts) {

            let product = relatedProducts[x];

            let object = {};

            object.image = product.image;

            object.name = product.name;

            object.id = product._id;

            object.costPrice = product.costPrice;

            object.sellingPrice = product.sellingPrice;

            var favouriteInfo = await userModel.findOne({
                _id: userId
            }, {
                wishlist: 1
            });

            let index = favouriteInfo.wishlist.includes(product._id);

            if (index) {

                object.isFavourite = true;
            } else {

                object.isFavourite = false;
            }

            objectArray.push(object)
        }


        let productDetailSummary = {};
        productDetailSummary.id = productDetail._id;
        productDetailSummary.name = productDetail.name;
        productDetailSummary.image = productDetail.image;
        productDetailSummary.seller = productDetail.shopOwnerId;
        productDetailSummary.sellingPrice = productDetail.sellingPrice;
        productDetailSummary.costPrice = productDetail.costPrice;
        productDetailSummary.description = productDetail.description;
        productDetailSummary.avarege_rating = productDetail.avarege_rating;
        productDetailSummary.totalReviews = totalReviews.length;
        productDetailSummary.varients = productVaraiants,
        productDetailSummary.relatedProducts = objectArray;
        productDetailSummary.avaregeRating = avgRating;
        let favouriteInfo1 = await userModel.findOne({
            _id: userId
        }, {
            wishlist: 1
        });
        let wishlist = favouriteInfo1.wishlist;
        if (wishlist.includes(productDetail._id)) {
            productDetailSummary.isFavourite = true;
        } else {
            productDetailSummary.isFavourite = false;
        }
        res.status(200).send({
            success: 1,
            imageBase: productsConfig.imageBase,
            item: productDetailSummary
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: err.message || 'Something went wrong while fetching product detail'
        })
    }


}

exports.listBySeller = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.query;
    let findCriteria = {};

    if (!query.id){
        return res.send({
            success:0,
            message:"please mention a seller"
        })
    }

    findCriteria.status = 1;
    findCriteria.parent = params.id;
    let projection = {};

    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };

    projection.status = 1;
    projection._id = 1;
    projection.image = 1;
    projection.name = 1;
    projection.sellingPrice = 1;
    projection.costPrice = 1;



    let Data = await ProductModel.find(findCriteria, projection, pageParams)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    if (Data && Data.success && Data.success == 0) {
        return res.send({
            success: 0,
            message: "some thing went wrong"
        })
    }

    var itemsCount = await ProductModel.countDocuments(findCriteria);
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }

    if (page > totalPages) {
        return res.send({
            success: 0,
            message: "No products to show"
        })
    }

    var objectArray = [];
    for (x in Data) {

        let product = Data[x];

        let object = {};

        object.image = product.image;

        object.name = product.name;

        object.id = product._id;

        object.costPrice = product.costPrice;

        object.sellingPrice = product.sellingPrice;

        var favouriteInfo = await userModel.findOne({
            _id: userId
        }, {
            wishlist: 1
        });

        let index = favouriteInfo.wishlist.includes(product._id);

        if (index) {

            object.isFavourite = true;
        } else {

            object.isFavourite = false;
        }

        objectArray.push(object)
    }



    return res.send({
        success: 1,
        pagination,
        imageBase: productsConfig.imageBase,
        message: "products listed",
        items: objectArray
    })



}


exports.listByFilter = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    var params = req.body;

    var selector = {};
    var projection = {};
    selector.status = 1;

    if (params.out_of_stock) {
        selector.out_of_stock = true;
    }
    if (params.isPromoted) {
        selector.inPromotion = true;
    }

    if (filter.price_range) {
        selector.sellingPrice = {
            $gt: params.lowerprice,
            $lt: params.upperprice
        }
    }

    projection.status = 1,
        projection.image = 1,
        projection.name = 1,
        projection.sellingPrice = 1,
        projection.costPrice = 1,
        projection._id = 0


    let categoryData = await ProductModel.find(selector, projection)
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

async function listRelatedProducts(arrray) {

    var rel_prods = [];

    for (item in array) {


        let findCriteria = {};

        findCriteria.status = 1;
        findCriteria._id = item

        let projection = {};


        projection.tSCreatedAt_at = 0
        projection.tSModifiedAt_at = 0

        let Data = await ProductModel.findOne(findCriteria, projection)
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while checking phone',
                    error: err
                }
            })
        if (Data) {
            rel_prods.push(Date)

        }
    }
    return rel_prods

}

exports.listByCategory = async (req, res) => {


    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    if (!params) {
        return res.send({
            sucess: 0,
            msg: "did not find any parameters"
        });
    }
    if (!params.category) {
        return res.send({
            sucess: 0,
            msg: "did not find category"
        });
    }


    let findCriteria = {};

    findCriteria.status = 1;
    findCriteria.category = params.category;
    let projection = {};


    projection.image = 1,
        projection.name = 1,
        projection.sellingPrice = 1,
        projection.costPrice = 1,
        projection._id = 1


    let categoryData = await ProductModel.find(findCriteria, projection)
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

// show variants 

exports.listVariants = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.body;
    if (!params) {
        return res.send({
            sucess: 0,
            msg: "did not find any parameters"
        });
    }
    if (!params.parent) {
        return res.send({
            sucess: 0,
            msg: "did not find parent product"
        });
    }


    let findCriteria = {};

    // findCriteria.status = 1;
    findCriteria.parent = params.parent;
    findCriteria.isAvailable = true;

    var filter = {};
    filter.isAvailable = 0;
    filter.parent = 0;

    let data = await VarModel.find(findCriteria, filter)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })
    if (data) {

        return res.send({
            success: 1,
            items: data
        })
    }


}

// search 











async function addVariantProduct(array, id) {

    for (obj in array) {
        console.log(obj);
        console.log("flag");
        try {

            const Prod = new VarModel({
                size: array[obj].size,
                stockAvailable: array[obj].qty,
                parent: id,
                sellingPrice: array[obj].sellingPrice,
                costPrice: array[obj].costPrice,
                isAvailable: true,
                currency: array[obj].currency || "INR",
                status: 1
            });
            var prod = await Prod.save();



        } catch (err) {

        }
    }
}

exports.update = async (req, res) => {

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

    if (!params.id) {
        return res.send({
            success: 0,
            msg: "id not provided"
        })
    }
    if (!params.updateData) {
        return res.send({
            success: 0,
            msg: "no update provided"
        })
    }

    if (params.updateData.discount > 99) {
        return res.send({
            success: 0,
            msg: "discount is not feasible"
        })
    }

    var updated = await ProductModel.updateOne({
        _id: params.id
    },
        params.updateData
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
exports.remove = async (req, res) => {

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

    if (!params.id) {
        return res.send({
            success: 0,
            msg: "id not provided"
        })
    }


    var updated = await ProductModel.updateOne({
        _id: params.id
    }, {
        status: 0
    }).catch(err => {
        return 5;
    });

    if (!updated) {
        return res.send({
            success: 0,
            msg: "did not removed"
        })
    }

    return res.send({
        success: 1,
        msg: " removed"
    })


}


exports.search = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let params = req.query;
    //let query = req.query;


    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
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
    /*if (!params.word && !params.category) {
        return this.list(req, res);
    }*/

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

        findCriteria.brand = {
            $in: params.brand
        };
    }

    // if (!params.seller){

    //     findCriteria.shopOwnerId = params.seller
    // }
    if (params.price_range) {
        findCriteria.sellingPrice = {
            $gt: params.lowerprice,
            $lt: params.upperprice
        }
    }

    var sort = {};
    if (params.sort) {
        if (params.sort == "priceHighToLow") {
            sort = {
                "sellingPrice": -1
            }
        }
        if (params.sort == "priceLowToHigh") {
            sort = {
                "sellingPrice": 1
            }
        }
        if (params.sort == "highestRated") {

            sort = {
                'avaregeRating': -1
            }
        }
    }


    // if (params.out_of_stock) {
    //     findCriteria.out_of_stock = true;
    // }
    // if (params.isPromoted) {
    //     findCriteria.inPromotion = true;
    // }

    // if (params.upperprice && params.lowerprice) {
    //     findCriteria.sellingPrice = {
    //         $gt: params.lowerprice || 0.0,
    //         $lt: params.upperprice
    //     }
    // } else {
    //     if (params.upperprice) {
    //         findCriteria.sellingPrice = {

    //             $lt: params.upperprice
    //         }
    //     }
    //     if (params.sellingPrice) {
    //         findCriteria.sellingPrice = {

    //             $gt: params.lowerprice
    //         }
    //     }
    // }





    let projection = {};


    projection.image = 1;
    projection.name = 1;
    projection.sellingPrice = 1;
    projection.costPrice = 1;
    projection.description = 1;
    projection.avaregeRating = 1;
    //projection.shopOwnerId = 1;





    let Data = await ProductModel.find(findCriteria, projection, pageParams).populate({
        path: 'shopOwnerId',
        select: 'shopName'
    }).sort(sort)
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

    } else {

        if (pageNum == 1) {
            if (Data.length == 0) {
                return res.send({
                    success: 0,

                    message: "no matching results"
                })
            }
        } else {
            if (Data.length == 0) {
                return res.send({
                    success: 0,

                    message: "end of results"
                })
            }
        }

        var objectArray = [];
        for (x in Data) {

            let product = Data[x];

            let object = {};

            object.image = product.image;

            object.name = product.name;

            object.id = product._id;

            object.costPrice = product.costPrice;

            object.sellingPrice = product.sellingPrice;

            object.avaregeRating = product.avaregeRating;

            var favouriteInfo = await userModel.findOne({
                _id: userId
            }, {
                wishlist: 1
            });

            let index = favouriteInfo.wishlist.includes(product._id);

            if (index) {

                object.isFavourite = true;
            } else {

                object.isFavourite = false;
            }

            objectArray.push(object)
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
exports.addImage = async (req, res) => {
    let file = req.file;
    if (!file) {
        return res.status(400).send({
            success: 0,
            field: 'image',
            message: 'image cannot be empty'
        })
    }


    var updated = await ProductModel.updateOne({
        $push: {
            image: file.filename
        }
    }, {
        status: 0
    }).catch(err => {
        return 5;
    });
    return res.send("ok");


}

exports.createBanner = async (req, res) => {
    let file = req.file;
    if (!file) {
        return res.status(400).send({
            success: 0,
            field: 'image',
            message: 'image cannot be empty'
        })
    }
    try {
        const newBanner = new Banner({
            image: file.filename,
            status: 1,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        let saveBanner = await newBanner.save();
        res.status(200).send({
            success: 1,
            message: 'Banner uploaded successfully'
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while creating banner' || err.message
        })
    }
}

exports.home = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    try {
        let bannerFilter = {
            status: 1
        };
        let bannerProjection = {
            image: 1
        };
        let banners = await Banner.find(bannerFilter, bannerProjection);
        let categoryFilter = {
            status: 1
        };
        let categoryProjection = {
            name: 1,
            image: 1
        };
        let categoryList = await Category.find(categoryFilter, categoryProjection).limit(5);
        let productFilter = {
            status: 1
        };
        let productProjection = {
            name: 1,
            image: 1,
            sellingPrice: 1,
            costPrice: 1
        };
        let topSavers = await ProductModel.find(productFilter, productProjection).limit(5);
        var objectArray = [];
        for (x in topSavers) {

            let product = topSavers[x];

            let object = {};

            object.image = product.image;

            object.name = product.name;

            object.id = product._id;

            object.costPrice = product.costPrice;

            object.sellingPrice = product.sellingPrice;

            var favouriteInfo = await userModel.findOne({
                _id: userId
            }, {
                wishlist: 1
            });

            let index = favouriteInfo.wishlist.includes(product._id);

            if (index) {

                object.isFavourite = true;
            } else {

                object.isFavourite = false;
            }

            objectArray.push(object)
        }
        res.status(200).send({
            success: 1,
            bannerImageBase: bannerConfig.imageBase,
            categoriesImageBase: categoriesConfig.imageBase,
            productImageBase: productsConfig.imageBase,
            banners: banners,
            categoryList: categoryList,
            topSavers: objectArray,
            bestSell: objectArray
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while fetching home data' || err.message
        })
    }
}

// *** Product review management for admin panel ***
exports.reviews = async (req, res) => {
    var params = req.query;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || productsConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : productsConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    try {
        let productReviews = await Reviews.find({
            status: 1
        }).populate({
            path: 'productId',
            select: 'name'
        }).skip(offset).limit(perPage).sort({
            'tscreatedAt': -1
        });
        let itemsCount = await Reviews.countDocuments({
            status: 1
        });
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
        let productReviewsArray = [];
        for (let i = 0; i < productReviews.length; i++) {
            let productReviewsObj = {};
            productReviewsObj.id = productReviews[i].productId.id;
            productReviewsObj.productName = productReviews[i].productId.name;
            productReviewsObj.customerName = productReviews[i].user.name;
            productReviewsObj.review = productReviews[i].content;
            productReviewsArray.push(productReviewsObj);
        };
        res.status(200).send({
            success: 1,
            pagination: pagination,
            items: productReviewsArray
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while listing reviews' || err.message
        })
    }
}


exports.stocks = async (req, res) => {
    try {
        let stockList = await ProductModel.find({
            status: 1
        }, {
            name: 1,
            qty: 1
        });
        res.status(200).send({
            success: 1,
            items: stockList
        })
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while listing stocks' || err.message
        })
    }
}


exports.editStock = async (req, res) => {
    let id = req.params.id;
    let name = req.body.name;
    let qty = req.body.qty;
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            success: 0,
            message: 'Nothing to update'
        })
    }
    let update = {};
    let filter = {
        _id: id,
        status: 1
    };
    if (name) {
        update.name = name;
    }
    if (qty) {
        update.qty = qty;
    }
    try {
        let updateProduct = await ProductModel.findOneAndUpdate(filter, update, {
            useFindAndModify: false
        });
        res.status(200).send({
            success: 1,
            message: 'Stock updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while updating stocks' || err.message
        })
    }
}


exports.deleteStock = async (req, res) => {
    let id = req.params.id;
    let filter = {
        _id: id,
        status: 1
    };
    let update = {
        status: 0
    };
    try {
        let deleteStock = await ProductModel.updateOne(filter, update);
        res.status(200).send({
            success: 1,
            message: 'Stock deleted successfully'
        });
    } catch (err) {
        res.status(500).send({
            success: 0,
            message: 'Something went wrong while deleting stocks' || err.message
        })
    }
}

exports.seachSellers = async (req, res) => {

    let params = req.query;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };
    var findCriteria = {};
    if (params.keyword) {
        var search = params.keyword;
        findCriteria = {
            $or: [{
                name: {
                    $regex: search,
                    $options: 'i',
                }
            }, {
                shopName: {
                    $regex: search,
                    $options: 'i'
                }
            }]
        };
    }
    findCriteria.status = 1;
    var projection = {};
    projection.address = 1;
    projection.name = 1;
    projection.shopName = 1;
    projection.image = 1;


    let Data = await VendorModel.find(findCriteria, projection, pageParams)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    if (Data && Data.success && Data.success == 0) {
        return res.send({
            success: 0,
            message: "some thing went wrong"
        })
    }

    var itemsCount = await VendorModel.countDocuments({status:1});
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }

    if (page > totalPages) {
        return res.send({
            success: 0,
            message: "No products to show"
        })
    }
    return res.send({
        success: 1,
        pagination,
        
        message: "products listed",
        items: Data
    })

}

exports.listChildProducts = async (req, res) => {

    let params = req.query;
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };

    let shopOwner = req.query.id;
    
    findCriteria = {};
    findCriteria.status = 1;
    findCriteria.shopOwnerId = shopOwner;
    var projection = {};
    projection.name = 1;
    projection.costPrice = 1;
    projection.sellingPrice = 1;
    projection.images =1 ;
    


    let Data = await childProductModel.find(findCriteria, projection, pageParams)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking phone',
                error: err
            }
        })

    if (Data && Data.success && Data.success == 0) {
        return res.send({
            success: 0,
            message: "some thing went wrong"
        })
    }

    

    var itemsCount = await childProductModel.countDocuments(findCriteria);
    var totalPages = itemsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page: page,
        perPage: perPage,
        hasNextPage: hasNextPage,
        totalItems: itemsCount,
        totalPages: totalPages
    }

    if (page > totalPages) {
        return res.send({
            success: 0,
            message: "No products to show"
        })
    }
    return res.send({
        success: 1,
        pagination,
        
        message: "products listed",
        items: Data
    })

}