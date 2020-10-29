var constants = require('./constants')
var VariantsModel = require('../models/variant.model')
var ProductsModel = require('../models/product.model')
module.exports = {
    updateStock: async function (operation, products) {
        if (operation === constants.INCREMENT_STOCK) {
            await products.forEach(async (item) => {
                var findCriteria = {};
                if (item.isVariant) {
                    findCriteria._id = item.variantId._id;
                    findCriteria.parent = item.productId._id;
                    findCriteria.status = 1;


                    var updateData = await VariantsModel.updateOne(findCriteria,
                        { $inc: { "stockAvailable": item.quantity } })

                        .catch(err => {
                            return {
                                success: 0,
                                message: 'Something went wrong while incrementing variant stock',
                                error: err
                            }
                        })
                    if (updateData && updateData.success && (updateData.success === 0)) {
                        console.log("error");
                    }
                    console.log(updateData)
                } else {
                    findCriteria._id = item.productId._id;
                    findCriteria.status = 1;

                    var updateData = await ProductsModel.updateOne(findCriteria,
                        { $inc: { "stockAvailable": item.quantity } })
                        .catch(err => {
                            return {
                                success: 0,
                                message: 'Something went wrong while incrementing product stock',
                                error: err
                            }
                        })
                    if (updateData && updateData.success && (updateData.success === 0)) {
                        console.log("error");
                    }
                    console.log(updateData)


                }
            });
            return true;
        } else if (operation === constants.DECREMENT_STOCK) {
            await products.forEach(async (item) => {
                var findCriteria = {};
                if (item.isVariant) {

                    findCriteria._id = item.variantId._id;
                    findCriteria.parent = item.productId._id;
                    findCriteria.status = 1;

                    var updateData = await VariantsModel.updateOne(findCriteria,
                        { $inc: { "stockAvailable": -(item.quantity) } })
                        .catch(err => {
                            return {
                                success: 0,
                                message: 'Something went wrong while incrementing variant stock',
                                error: err
                            }
                        })
                    if (updateData && updateData.success && (updateData.success === 0)) {
                        console.log("error");

                    }
                    console.log(updateData)
                } else {
                    findCriteria._id = item.productId._id;
                    findCriteria.status = 1;
                    var updateData = await ProductsModel.updateOne(findCriteria,
                        { $inc: { "stockAvailable": -(item.quantity) } })
                        .catch(err => {
                            return {
                                success: 0,
                                message: 'Something went wrong while incrementing product stock',
                                error: err
                            }
                        })
                    if (updateData && updateData.success && (updateData.success === 0)) {
                        console.log("error");

                    }
                    console.log(updateData)


                }
            });
            return true;
        }
    },
    setIsOutOfStock: async function (products) {
        await Promise.all(products.map(async (item, i) => {
            if (item.isVariant) {
                if (item.quantity <= item.variantId.stockAvailable) {
                    products[i].isOutOfStock = false;
                }else{
                    products[i].isOutOfStock = true;
                }
            } else {
                if (item.quantity <= item.productId.stockAvailable) {
                    products[i].isOutOfStock = false;
                }else{
                    products[i].isOutOfStock = true;
                }
            }
        }));
        return products;
    }


}
