
var config = require('../../config/app.config');
const Carts = require('../models/cart.model');
const constants = require('../helpers/constants');
var pushNotificationHelper = require('../helpers/pushNotificationHelper')
var paginationHelper = require('../helpers/paginationHelper')
var productValidator = require('../validators/product.validator')
var stockHelper = require('../helpers/stockHelper');

var config = require('../../config/app.config')
var cartConfig = config.cart;
var productsConfig = config.products;


exports.addToCart = async (req, res) => {
    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    if (!params.productId || (params.isVariant === undefined) || ( (params.isVariant == true) && !params.variantId) || !params.count) {
        var errors = [];
        let message = "";
        if (!params.productId) {
            errors.push({
                field: "productId",
                message: "Require product id"
            });
            message = "Require product id";
        }
        if (!params.isVariant) {
            errors.push({
                field: "isVarient",
                message: "Require isVariant"
            });
            message = "Require isVariant";
        }
        if (!params.shopOwnerId) {
            errors.push({
                field: "isVarient",
                message: "Require shopOwnerId"
            });
            message = "Require shopOwnerId";
        }
        if (!params.isVariant && !params.variantId) {
            errors.push({
                field: "variantId",
                message: "Require variantId"
            });
            message = "Require variantId";
        }
        if (!params.count) {
            errors.push({
                field: "count",
                message: "Require product count"
            });
            message = "Require product count";
        }
        return res.send({
            success: 0,
            statusCode: 400,
            message,
            errors: errors,
        });
    }

    var productCheck = await productValidator.checkProduct(params);
    if (productCheck.success === 0) {
        return res.send(productCheck);
    }
    let findCriteria = {};
    findCriteria.isConvertedToOrder = false;
    findCriteria.userId = userId;
    findCriteria.status = 1;

    var pendingCartExists = await Carts.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while checking cart',
                error: err
            }
        })

    if (pendingCartExists && (pendingCartExists.success !== undefined) && (pendingCartExists.success === 0)) {
        return res.send(pendingCartExists);
    }
    if (pendingCartExists) {
        var isProductAlreadyExists = false;
        var mainProducts = pendingCartExists.products;
        var condition = {}
        var quantity = productCheck.productObj.quantity;
        var totalPrice = 0;
        var arrayFilterObj = {};
        if (!productCheck.productObj.isVariant) {
            let productIndex = await mainProducts.findIndex(product => (JSON.stringify(product.productId) === JSON.stringify(productCheck.productObj.productId) && (product.status === 1)))
            if (productIndex > -1) {
                isProductAlreadyExists = true;
                condition.productId = productCheck.productObj.productId;
                quantity = quantity + mainProducts[productIndex].quantity;
                totalPrice = quantity * mainProducts[productIndex].price;
                arrayFilterObj = {
                    "outer.productId": productCheck.productObj.productId
                }
            }
        } else {
            var productIndex = await mainProducts.findIndex(product => (JSON.stringify(product.productId) === JSON.stringify(productCheck.productObj.productId)) &&
                (JSON.stringify(product.variantId) === JSON.stringify(productCheck.productObj.variantId) && (product.status === 1)));
            if (productIndex > -1) {
                isProductAlreadyExists = true;
                condition.variantId = productCheck.productObj.variantId;
                quantity = quantity + mainProducts[productIndex].quantity;
                totalPrice = quantity * mainProducts[productIndex].price;
                arrayFilterObj = {
                    "outer.variantId": productCheck.productObj.variantId,
                }
            }
        }


        if (!isProductAlreadyExists) {
            var productId = pendingCartExists.id;
            var update = {
                $push: {
                    products: productCheck.productObj
                },
                tsModifiedAt: Date.now()
            };
            var addItemData = await Carts.updateOne(findCriteria, update)
                .catch(err => {
                    return {
                        success: 0,
                        message: 'Something went wrong while add new item in cart',
                        error: err
                    }
                })

            if (addItemData && (addItemData.success !== undefined) && (addItemData.success === 0)) {
                return res.send(addItemData);
            }
            return res.send({
                message: "Item added to cart successfully",
                success: 1,
            })
        } else {
            var updateCart = await Carts.updateOne({
                "_id": pendingCartExists.id,
                "products": {
                    "$elemMatch": condition
                },
                status: 1

            }, {
                "$set": {
                    "products.$[outer].quantity": quantity,
                    "products.$[outer].totalPrice": totalPrice,
                }
            }, {
                "arrayFilters": [arrayFilterObj]
            })
                .catch(err => {
                    return {
                        success: 0,
                        message: 'Something went wrong while add item in cart',
                        error: err
                    }
                })

            if (updateCart && (updateCart.success !== undefined) && (updateCart.success === 0)) {
                return res.send(updateCart);
            }
            return res.send({
                message: "Item added to cart successfully",
                success: 1,
            })

        }
    } else {
        var products = [];
        products.push(productCheck.productObj);
        var cartObj = {
            userId,
            products: [
                productCheck.productObj
            ],
            isConvertedToOrder: false,
            status: 1,
            tsCreatedAt: Date.now(),
            tsModifiedAt: null
        }

        var newCartData = new Carts(cartObj);
        var insertData = await newCartData.save()
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while saving cart',
                    error: err
                }
            })

        if (insertData && (insertData.success !== undefined) && (insertData.success === 0)) {
            return res.send(insertData);
        }
        return res.send({
            message: "Item added to cart successfully",
            success: 1,
        })

    }

}

exports.showCart = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    var params = req.query;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || cartConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : cartConfig.resultsPerPage;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };

    var filter = {
        userId,
        isConvertedToOrder: false,
        status: 1
    };
    var cartData = await Carts.findOne(filter,
        {
            "products.productId": 1,
            "products.isVariant": 1,
            "products.variantId": 1,
            "products.quantity": 1,
            "products.price": 1,
            "products.totalPrice": 1,
            "products.variant": 1,
            "products.status": 1,
            "products.tsCreatedAt": 1,
        }
    )
        .populate([{
            path: 'products.productId',
            select: { name: 1 ,stockAvailable : 1,image : 1}
        }, {
            path: 'products.variantId',
            select: { size: 1, unit: 1,stockAvailable : 1 }
        }
        ])
        .sort({
            'products.tsCreatedAt': -1
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting cart',
                error: err
            }
        })

    if (cartData && (cartData.success !== undefined) && (cartData.success === 0)) {
        return res.send(cartData);
    }

    // cartData = JSON.parse(JSON.stringify(cartData));
    var products = [];
    var total = 0;
    var cartId;
    if (cartData && cartData.products && cartData.products.length > 0) {
        products = cartData.products;
        products = products.filter(x => x.status == 1);
        products = JSON.parse(JSON.stringify(products))
        products = await stockHelper.setIsOutOfStock(products);
        total = await getTotal(products);
        cartId = cartData.id;

    }

    var productsCount = products.length;
    products = paginationHelper.paginate(products, perPage, page);


    var totalPages = productsCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page,
        perPage,
        hasNextPage,
        totalItems: productsCount,
        totalPages,
    };
    var discount = 0;
    var deliveryCharge = 0;
    var subTotal = total;
    var total = subTotal - discount + deliveryCharge;
    return res.send({
        success: 1,
        pagination,
        imageBase: productsConfig.imageBase,
        items: products,
        subTotal,
        total,
        discount: 0,
        deliveryCharge: 0,
        cartId: cartId || null
    })
}

exports.updateCart = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let findCriteria = {
        // _id: cartId,
        userId,
        isConvertedToOrder: false,
        status: 1
    }
    var cartData = await Carts.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting cart',
                error: err
            }
        })

    if (cartData && (cartData.success !== undefined) && (cartData.success === 0)) {
        return res.send(cartData);
    }
    if (cartData) {
        var params = req.body;
        if (!params.productId && !params.variantId) {
            return res.send({
                success: 0,
                message: 'Missing required fields( productId or varientId)'
            })
        }
        if (!params.count) {
            return res.send({
                success: 0,
                message: 'Nothing to update'
            })
        }
        if (params.count <= 0) {
            return res.send({
                success: 0,
                message: 'Count of product must be greater than 0'
            })
        }

        var condition = {}
        var quantity = params.count;
        var totalPrice = 0;
        var arrayFilterObj = {};

        if (params.productId && !params.variantId) {
            var productIndex = await cartData.products.findIndex(product => (JSON.stringify(product.productId) === JSON.stringify(params.productId) && (product.status === 1)))
            if (productIndex > -1) {
                condition.productId = params.productId;
                totalPrice = quantity * cartData.products[productIndex].price;
                arrayFilterObj = {
                    "outer.productId": params.productId
                }
            } else {
                return res.send({
                    success: 0,
                    message: 'Product not exists in cart'
                })
            }
        }
        if (params.variantId) {
            var productIndex = await cartData.products.findIndex(product => (JSON.stringify(product.variantId) === JSON.stringify(params.variantId) && (product.status === 1)));
            if (productIndex > -1) {
                condition.variantId = params.variantId;
                totalPrice = quantity * cartData.products[productIndex].price;
                arrayFilterObj = {
                    "outer.variantId": params.variantId,
                }
            } else {
                return res.send({
                    success: 0,
                    message: 'Product not exists in cart'
                })
            }
        }

        var updateCart = await Carts.updateOne({
            "_id": cartData.id,
            "products": {
                "$elemMatch": condition
            },
            status: 1

        }, {
            "$set": {
                "products.$[outer].quantity": quantity,
                "products.$[outer].totalPrice": totalPrice,
                "products.$[outer].tsModifiedAt": Date.now(),
            }
        }, {
            "arrayFilters": [arrayFilterObj]
        })
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while updating quantity in cart',
                    error: err
                }
            })

        if (updateCart && (updateCart.success !== undefined) && (updateCart.success === 0)) {
            return res.send(updateCart);
        }
        return res.send({
            message: "Quantity updated successfully",
            success: 1
        })

    } else {
        return res.send({
            success: 0,
            message: 'Cart not exists'
        })
    }

}

exports.deleteCartItem = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let findCriteria = {
        // _id: cartId,
        userId,
        isConvertedToOrder: false,
        status: 1
    }
    var cartData = await Carts.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting cart',
                error: err
            }
        })

    if (cartData && (cartData.success !== undefined) && (cartData.success === 0)) {
        return res.send(cartData);
    }
    if (cartData) {
        var params = req.body;
        if (!params.productId && !params.variantId) {
            return res.send({
                success: 0,
                message: 'Missing required fields( productId or varientId)'
            })
        }

        var condition = {}
        var arrayFilterObj = {};
        var status = 0;
        if (params.productId && !params.variantId) {
            var productIndex = await cartData.products.findIndex(product => (JSON.stringify(product.productId) === JSON.stringify(params.productId) && (product.status === 1)))
            if (productIndex > -1) {
                arrayFilterObj = {
                    "outer.productId": params.productId
                }
            } else {
                return res.send({
                    success: 0,
                    message: 'Product not exists in cart'
                })
            }
        }
        if (params.variantId) {
            var productIndex = await cartData.products.findIndex(product => (JSON.stringify(product.variantId) === JSON.stringify(params.variantId) && (product.status === 1)));
            if (productIndex > -1) {
                arrayFilterObj = {
                    "outer.variantId": params.variantId,
                }
            } else {
                return res.send({
                    success: 0,
                    message: 'Product not exists in cart'
                })
            }
        }

        var deleteProductInCart = await Carts.updateOne({
            "_id": cartData.id,
            "products": {
                "$elemMatch": condition
            },
            status: 1

        }, {
            "$set": {
                "products.$[outer].status": 0,
                "products.$[outer].tsModifiedAt": Date.now(),
            }
        }, {
            "arrayFilters": [arrayFilterObj]
        })
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while remove product in cart',
                    error: err
                }
            })

        if (deleteProductInCart && (deleteProductInCart.success !== undefined) && (deleteProductInCart.success === 0)) {
            return res.send(deleteProductInCart);
        }
        return res.send({
            message: "Item deleted successfully",
            success: 1
        })

    } else {
        return res.send({
            success: 0,
            message: 'Cart not exists'
        })
    }
}

exports.getCartCount = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let findCriteria = {
        // _id: cartId,
        userId,
        isConvertedToOrder: false,
        status: 1
    }
    var cartData = await Carts.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting cart',
                error: err
            }
        })

    if (cartData && (cartData.success !== undefined) && (cartData.success === 0)) {
        return res.send(cartData);
    }
    if (cartData && cartData.products && cartData.products.length > 0) {
        var products = cartData.products;
        products = products.filter(x => x.status == 1);
        return res.send({
            success: 1,
            count: products.length,
            message: "Cart count"
        })

    } else {
        return res.send({
            success: 1,
            count: 0,
            message: "Cart count"
        })
    }
}

async function getTotal(products) {
    var total = 0;
    for (let i = 0; i < products.length; i++) {
        var subTotal = products[i].totalPrice;
        total = total + subTotal;
    }
    return total;
}