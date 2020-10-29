var Products = require('../models/product.model');
var Variants = require('../models/variant.model');
var Vendor = require('../models/vendor.model');

module.exports = {
    checkProduct: async function (data) {

        var productObj = {
            productId: data.productId,
            quantity: data.count
        }
        var productCheck = await Products.findOne({
            _id: data.productId,
            //isActive : true,
            status: 1
        })
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while checking product',
                    error: err
                }
            })

        if (productCheck && (productCheck.success !== undefined) && (productCheck.success === 0)) {
            return productCheck;
        }

        // multi vendor type added by rakesh

        var vendorCheck = await Vendor.findOne({
            _id: productCheck.shopOwnerId,
            //isActive : true,
            status: 1
        })
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while checking product',
                    error: err
                }
            })

        if (productCheck && (productCheck.success !== undefined) && (productCheck.success === 0)) {
            return productCheck;
        }
        if (vendorCheck){
            productObj.shopOwnerId = productCheck.shopOwnerId;
        }

        // end
        if (productCheck) {
            if (data.count <= 0) {
                return {
                    success: 0,
                    message: 'Qunatity must be greater than 0'
                }
            }
            if (data.isVariant == true) {
                productObj.isVariant = true;
                if (productCheck.variantsExists) {
                    var variantId = data.variantId;
                    productObj.variantId = variantId;

                    var findCriteria = {
                        _id: variantId,
                        parent: data.productId,
                        isActive: true,
                        status: 1
                    }

                    var variantCheck = await Variants.findOne(findCriteria)
                        .catch(err => {
                            return {
                                success: 0,
                                message: 'Something went wrong while checking Variants',
                                error: err
                            }
                        })

                    if (variantCheck && (variantCheck.success !== undefined) && (variantCheck.success === 0)) {
                        return variantCheck;
                    }
                    if (variantCheck) {


                        if (variantCheck.stockAvailable >= data.count) {
                            productObj.price = variantCheck.sellingPrice;
                            var totalPrice = variantCheck.sellingPrice * data.count;
                            productObj.totalPrice = totalPrice;
                            productObj.variant = variantCheck.size + ' ' + variantCheck.unit;
                            productObj.isReviewable = false;
                            productObj.status = 1;
                            productObj.tsCreatedAt = Date.now();
                            productObj.tsModifiedAt = null;

                            return {
                                success: 1,
                                message: 'Validated',
                                productObj
                            }
                        } else {
                            return {
                                success: 0,
                                message: 'Variant stock not available',
                                stockAvailable: variantCheck.stockAvailable
                            }
                        }

                    } else {
                        return {
                            success: 0,
                            message: 'Invalid variant'
                        }
                    }

                } else {
                    return {
                        success: 0,
                        message: 'Variants not existed in this product'
                    }
                }

            } else {

                productObj.isVariant = false;
                productObj.price = productCheck.sellingPrice;

                if (productCheck.stockAvailable >= data.count) {
                    var totalPrice = productCheck.sellingPrice * data.count;
                    productObj.totalPrice = totalPrice;
                    productObj.isReviewable = false;
                    productObj.status = 1;
                    productObj.tsCreatedAt = Date.now();
                    productObj.tsModifiedAt = null;
                    return {
                        success: 1,
                        message: 'Validated',
                        productObj
                    }
                } else {
                    return {
                        success: 0,
                        message: 'Product out of stock',
                        stockAvailable: productCheck.stockAvailable
                    }
                }
            }
        } else {
            return {
                success: 0,
                message: 'Product not existed'
            }
        }
    }
}