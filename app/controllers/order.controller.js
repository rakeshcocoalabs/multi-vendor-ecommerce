var CartModel = require('../models/cart.model');
var CodeModel = require('../models/promocode.model');
const productModel = require('../models/product.model');
const variantModel = require('../models/variant.model');
const AddressModel = require('../models/address.model');
var config = require('../../config/app.config');
var constants = require('../helpers/constants');
const cartModel = require('../models/cart.model');
var orderConfig = config.order;
var productsConfig = config.products;
//const constants = require('../helpers/constants');
var pushNotificationHelper = require('../helpers/pushNotificationHelper');
var stockHelper = require('../helpers/stockHelper');
var statusUpdateHelper = require('../helpers/statusUpdateHelper')
var stockValidator = require('../validators/stock.validator');


exports.checkout = async (req, res) => {
    var params = req.body;

    let userDataz = req.identity.data;
    let userId = userDataz.id;

    if (!params.deliveryAddress) {
        return res.send({
            success: 0,
            message: "Please provide address"
        })
    }
    if (!params.cartId) {
        return res.send({
            success: 0,
            message: "Please provide cart id"
        })
    }
    if (params.subTotal === undefined) {
        return res.send({
            success: 0,
            message: "Please provide sub total"
        })
    }
    if (params.discount === undefined) {
        return res.send({
            success: 0,
            message: "Please provide discount"
        })
    }
    if (params.deliveryCharge === undefined) {
        return res.send({
            success: 0,
            message: "Please provide delivery charge"
        })
    }
    if (params.grandTotal === undefined) {
        return res.send({
            success: 0,
            message: "Please provide grand total"
        })
    }
    var findCriteria = {
        _id: params.cartId,
        userId,
        isConvertedToOrder: false,
        status: 1
    };
    var cartData = await CartModel.findOne(findCriteria)
    .populate([{
        path: 'products.productId',
        select: { name: 1,stockAvailable : 1}
    },{
        path: 'products.variantId',
        select: { size: 1 , unit : 1,stockAvailable : 1}
    }
    ])
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
        var addressData = await AddressModel.findOne({
            _id: params.deliveryAddress,
            status: 1
        })
       
            .catch(err => {
                return {
                    success: 0,
                    message: 'Something went wrong while getting cart',
                    error: err
                }
            })

        if (addressData && (addressData.success !== undefined) && (addressData.success === 0)) {
            return res.send(addressData);
        }
        if (addressData) {
            if (cartData && cartData.products && cartData.products.length > 0) {
                var products = cartData.products;
                products = products.filter(x => x.status == 1);
                var validateProductData = await stockValidator.checkProductsStock(products);
                if(validateProductData && validateProductData.success !== undefined && validateProductData.success === 0){
                    return res.send(validateProductData);
                }
                var update = {};
                update.orderNo = + new Date() + "";
                update.deliveryAddress = params.deliveryAddress;
                update.subTotal = params.subTotal;
                update.discount = params.discount;
                update.deliveryCharge = params.deliveryCharge;
                update.grandTotal = params.grandTotal;
                update.isConvertedToOrder = true;
                update.isCancellable = true;
                update.isCancelled = false;
                update.isDelivered = false;
                update.statusHistory = [
                    {
                        sortOrder: 1,
                        orderStatus: constants.PENDING_ORDER,
                        datetime: Date.now(),
                        isCompleted: true
                    }
                ]
                update.orderDate =  Date.now();
                update.orderStatus = constants.PENDING_ORDER;
                update.deliveryStatus = "unassigned";
                update.tsModifiedAt = Date.now();

                var updateCart = await CartModel.updateOne(findCriteria, update)
                    .catch(err => {
                        return {
                            success: 0,
                            message: 'Something went wrong while updating cart',
                            error: err
                        }
                    })

                if (updateCart && (updateCart.success !== undefined) && (updateCart.success === 0)) {
                    return res.send(updateCart);
                }

                var updateStockResponse =  await stockHelper.updateStock(constants.DECREMENT_STOCK,products);
                var filtersJsonArr = [{ "field": "tag", "key": "user_id", "relation": "=", "value": userId }]
                // var metaInfo = {"type":"event","reference_id":eventData.id}
                var notificationObj = {
                    title: constants.CREATE_ORDER_NOTIFICATION_TITLE,
                    message: constants.CREATE_ORDER_NOTIFICATION_MESSAGE,
                    type: constants.ORDER_NOTIFICATION,
                    referenceId: params.cartId,
                    filtersJsonArr,
                    userId
                    // metaInfo,
                }
                var pushNotificationData = await pushNotificationHelper.sendNotification(notificationObj);
             
                return res.send({
                    success: 1,
                    message: 'Order placed successfully',
                })
            } else {
                return res.send({
                    success: 0,
                    message: 'Cart is empty'
                })
            }

        } else {
            return res.send({
                success: 0,
                message: "Address not exists"
            })
        }
    } else {
        return res.send({
            success: 0,
            message: "Cart not exists"
        })
    }
}

exports.listOrders = async (req, res) => {
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let params = req.query;

    let page = Number(params.page) || 1;
    let perPage = Number(params.perPage) || orderConfig.resultsPerPage;

    perPage = perPage > 0 ? perPage : orderConfig.resultsPerPage;
    var offset = (page - 1) * perPage;

    let findCriteria = {
        status: 1,
        isConvertedToOrder: true,
        userId,
    }
    let projection = {
        orderNo : 1,
        isCancellable : 1,
        isCancelled : 1,
        isDelivered : 1,
        grandTotal : 1,
        orderDate : 1,
        orderStatus : 1,

    }

    let orderData = await CartModel.find(findCriteria,projection)
        .limit(perPage)
        .skip(offset)
        .sort({
            'tsCreatedAt': -1
        })
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while listing orders',
                error: err
            }
        })
    if (orderData && (orderData.success !== undefined) && (orderData.success === 0)) {
        return res.send(orderData);
    }

    let totalOrderCount = await CartModel.countDocuments(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while getting total order count',
                error: err
            }
        })
    if (totalOrderCount && totalOrderCount.success && (totalOrderCount.success === 0)) {
        return res.send(totalOrderCount);
    }

    var totalPages = totalOrderCount / perPage;
    totalPages = Math.ceil(totalPages);
    var hasNextPage = page < totalPages;
    var pagination = {
        page,
        perPage,
        hasNextPage,
        totalItems: totalOrderCount,
        totalPages,
    };
    return res.send({
        success: 1,
        pagination,
        // imageBase: productsConfig.imageBase,
        items: orderData,
        message: 'Order list'
    })
}

exports.getOrderDetail = async(req,res) =>{
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    let orderId = req.params.id;
    var findCriteria = {
        userId,
        _id : orderId,
        isConvertedToOrder : true,
        status : 1
    }
    var projection = {
        status : 0,
        tsModifiedAt : 0,
        isConvertedToOrder : 0,
        
    }

    var orderData = await CartModel.findOne(findCriteria,projection)
    .populate([{
        path: 'products.productId',
        select: { name: 1,image : 1}
    },{
        path: 'products.variantId',
        select: { size: 1 , unit : 1}
    },{
        path : 'deliveryAddress',
        select : {tSCreatedAt : 0, tSModifiedAt : 0, default : 0, status : 0, owner : 0}
    }
    ])
    .catch(err => {
        return {
            success: 0,
            message: 'Something went wrong while getting order details',
            error: err
        }
    })
if (orderData && orderData.success && (orderData.success === 0)) {
    return res.send(orderData);
}
if(orderData){
    return res.send({
        success: 1,
        imageBase: productsConfig.imageBase,
        item: orderData,
        message: 'Order details'
    })
}else{
    return res.send({
        success: 0,
        message: "Order not exists"
    })
}
}


exports.cancelOrder = async(req,res) =>{
    var orderId = req.params.id;
    let userDataz = req.identity.data;
    let userId = userDataz.id;
   
    let findCriteria = {
        _id : orderId,
        userId,
        isConvertedToOrder :true,
        status : 1
    };

    var orderData = await CartModel.findOne(findCriteria)
    .catch(err => {
        return {
            success: 0,
            message: 'Something went wrong while checking order data',
            error: err
        }
    })
if (orderData && orderData.success && (orderData.success === 0)) {
    return res.send(orderData);
}
if(orderData){
    if(orderData.isCancellable){
        var cancelDateTime = Date.now()
        var statusHistory = await statusUpdateHelper.updateStatusHistory(orderData.statusHistory,constants.CANCELLED_ORDER,cancelDateTime);
        var update = {};
        update.isCancellable = false;
        update.isCancelled = true;
        update.statusHistory = statusHistory;
        update.orderStatus = constants.CANCELLED_ORDER;
        update.tsModifiedAt = cancelDateTime;

        var cancelOrderData = await CartModel.updateOne(findCriteria,update)
        .catch(err => {
            return {
                success: 0,
                message: 'Something went wrong while cancel order',
                error: err
            }
        })
    if (cancelOrderData && cancelOrderData.success && (cancelOrderData.success === 0)) {
        return res.send(cancelOrderData);
    }
    var products = orderData.products;
    products = products.filter(x => x.status == 1);
    var response =  await stockHelper.updateStock(constants.INCREMENT_STOCK,products)

        return res.send({
            success: 1,
            message: "Order cancelled successfully.."
        })  

    }else{
        if(orderData.isCancelled){
            return res.send({
                success: 0,
                message: "Order already cancelled.."
            })  
        }else{
        return res.send({
            success: 0,
            message: "Order cancellation not possible..."
        })  
    }
    }

}else{
    return res.send({
        success: 0,
        message: "Order not found"
    })  
}
    
}



exports.show = async (req, res) => {

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let findCriteria = {};

    findCriteria.owner = userId;
    findCriteria.status = 1;
    findCriteria.deliveryStatus = "active";
    let productArray = [];
    var items = [];
    var params = req.params;
    var page = Number(params.page) || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30//feedsConfig.resultsPerPage;
    perPage = perPage > 0 ? perPage : 30//feedsConfig.resultsPerPage;

    var start = 0;
    var end = 1;

    start = (page - 1) * perPage;
    end = start + perPage;

    let cartData = await CartModel.findOne(findCriteria, {
        products: 1, //{$slice: [start, end]},
        status: 1,
        Sum: 1
    })
        .catch(err => {
            return res.send({
                success: 0,
                message: 'did not get cart for the user',
                error: err
            })
        })

    if (!cartData) {
        return res.send({
            success: 0,
            message: "cart is empty"
        })
    }

    const products = cartData.products
    let productInfo = [];
    var totalAmt = 0.0;

    for (each in products) {

        let product = products[each];
        // return res.send(product);
        if (product.variant) {

            var itemcontent = {};
            var variantInfo = await variantModel.findOne({ _id: product.variant });
            itemcontent.size = variantInfo.size;
            itemcontent.price = variantInfo.price;
            let itemData = await productModel.findOne({ _id: variantInfo.parent });
            itemcontent.name = itemData.name;
            itemcontent.image = itemData.image || "sampleimage.jpeg";
            itemcontent.qty = product.qty;
            var amount = parseFloat(itemcontent.qty) * parseFloat(itemcontent.price);
            totalAmt = totalAmt + amount;
            productInfo.push(itemcontent);

        }
        else {
            var itemcontent = {};
            var productData = await productModel.findOne({ _id: product.id });

            if (!productData) {
                //return res.send(product.id)
                continue;
            }

            itemcontent.price = productData.price;

            itemcontent.name = productData.name;
            itemcontent.image = productData.image || "sampleimage.jpeg";
            itemcontent.qty = product.qty;
            var amount = parseFloat(itemcontent.qty) * parseFloat(itemcontent.price);
            totalAmt = totalAmt + amount;
            productInfo.push(itemcontent);
        }
    }
    var discount = (100 - 5) / 100;
    totalAmt = totalAmt * discount;
    return res.send({
        success: 1,
        message: "cart listed",
        items: productInfo,
        Discount: "5%",
        Sum: totalAmt
    })
    for (each in products) {

        if (products[each].id) {
            productArray.push(products[each].id)
        } else {
            productArray.push("0")
        }
    }

    var sum = 0.0;
    for (each in productArray) {
        let findCriteria1 = {};
        findCriteria1._id = productArray[each];
        findCriteria1.status = 1;

        var filter = {};

        filter.price = 1;
        filter.name = 1;
        filter.discount = 1;
        filter.image = 1;



        let data = await productModel.findOne(findCriteria1, filter)
            .catch(err => {
                console.log(err.message);
            })

        if (data) {
            data.qty = products[each].qty;
            //data.variant = products[each].variant;
            // if (data.variant && (data.variant != "")){

            //     let id = product_array[each].variant
            //     const variantInfo = await variantModel.findOne({
            //         _id: id
            //     },{
            //         size:1,
            //         unit:1
            //     });
            //     data.variant = variantInfo.size + (variantInfo.unit || "KG")
            // } 




            items.push(data);
            console.log(data);
            if (!data.discount) {
                var pointNum = parseFloat(data.discount);
                console.log("mark1");

                sum = sum + (parseInt(data.price) * products[each].qty)
            } else {
                var pointNum = parseFloat(data.discount);
                const price_after_discount = ((100 - pointNum) * parseFloat(data.price)) / 100;

                sum = sum + price_after_discount * products[each].qty;
            }

            console.log(sum);
            console.log("mark");
        } else {
            console.log("no data found");

        }

    }

    var itemsCount = items.length;
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

    return res.send({
        success: 1,
        pagination,
        msg: "cart loaded successfully",
        item: items,
        Total: sum
    })

}



async function updateSum(product_array) {

    var Sum = 0.0;
    console.log(product_array);
    for (each in product_array) {
        let qty = product_array[each].qty;

        if (product_array.variant) {
            let id = product_array[each].variant;

            let data = await variantModel.findOne({ _id: id });
            if (!data) {
                return 1;
            }
            console.log(data);
            console.log("listen");

            let price = Number(data.price);
            let number = Number(qty);
            Sum = Sum + (number * price);

        }
        else {
            let id = product_array[each].id;

            let data = await productModel.findOne({ _id: id });
            if (!data) {
                return 1;
            }


            let price = Number(data.price);
            let number = Number(qty);
            Sum = Sum + (number * price);
        }

    }

    return Sum


}

async function applyCode(code, id) {

    const codeOutPut = await CodeModel.findOne({
        code: code
    });
    const userOutPut = await CodeModel.find({
        code: code,
        users: {
            $in: [id]
        },
    })
    console.log(codeOutPut);
    console.log(id);
    console.log(userOutPut);


    let codeUpdate = await CodeModel.updateOne({
        code: code
    }, {
        $push: {
            users: id
        }
    }


    )
    console.log("code status", codeOutPut);

    if (codeOutPut && userOutPut.length == 0) {
        return {
            status: 1,
            percent: codeOutPut.percent,
            max: codeOutPut.maximum_discount,
            min: codeOutPut.minimum_amount
        }
    } else {
        return {
            status: 0
        }
    }
}


exports.insert1 = async (req, res) => {

    var params = req.body;

    let userDataz = req.identity.data;
    let userId = userDataz.id;
    let findCriteria = {};

    findCriteria.owner = userId;
    findCriteria.status = 1;


    let cartUpdate = await CartModel.updateOne(
        findCriteria, {
        $push: {
            products: {
                id: params.id,
                qty: params.qty,

            }
        }
    }
    )


    if (!cartUpdate) {
        return res.send({
            success: 0,
            msg: "could not update cart"
        })
    } else {
        return res.send({
            success: 1,
            msg: "added"
        })
    }

}

exports.insert = async (req, res) => {


    var params = req.body;
    let userDataz = req.identity.data;

    let userId = userDataz.id;
    let findCriteria = {};
    findCriteria.deliveryStatus = "active";
    findCriteria.owner = userId;

    findCriteria.orderStatus = constants.PENDING_ORDER;
    findCriteria.userId = userId;
    findCriteria.status = 1;

    let cartModifier = await updateCart(userId);


    let cartData = await CartModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    var cart_id = ""
    if (!cartData) {
        const Cart = new CartModel({
            status: 1,
            owner: userId,
            deliveryStatus: "active",
            active: true,
            repeatCount,
            tSCreatedAt: Date.now(),
            tSModifiedAt: null
        });
        var savecart = await Cart.save();
        cart_id = savecart._id;
    } else {
        cart_id = cartData._id
    }





    var cartUpdate;



    if (params.variant) {
        cartUpdate = await CartModel.updateOne({
            _id: cart_id
        }, {
            $push: {
                products: {
                    id: params.id,
                    qty: params.qty,
                    price: params.price,
                    variant: params.variant
                }
            }

        }


        )


    }
    else {
        cartUpdate = await CartModel.updateOne({
            _id: cart_id
        }, {
            $push: {
                products: {
                    id: params.id,
                    qty: params.qty,
                    price: params.price
                }
            }

        }


        )


    }

    let findCriteria1 = {};

    findCriteria1.owner = userId;
    findCriteria1.status = 1;
    var productsArr = await CartModel.findOne(findCriteria1, {
        products: 1
    })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!productsArr) {
        return res.send('no products');

    }

    const updatedSum = await updateSum(productsArr.products)

    let sumUpdate = await CartModel.updateOne({
        _id: cart_id
    }, { Sum: updatedSum })



    // const updatedProdcut = await updateProduct(params.id,params.qty,1)

    // if (updatedProdcut != 1){
    //     return res.send({
    //         msg:"some thing went wrong",
    //         success:0,
    //         id:updateProduct
    //     })
    // }

    if (cartUpdate && sumUpdate) {
        return res.send({
            message: "item added to cart successfully",
            status: 1
        })

    }

}


exports.delete = async (req, res) => {

    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    //let cartModifier = await updateCart(userId);

    let findCriteria = {};

    findCriteria.owner = userId;
    findCriteria.status = 1;
    findCriteria.deliveryStatus = "active";
    var cartData = await CartModel.findOne(findCriteria, {
        products: 1
    })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cartData) {
        return res.send('no products');

    }
    var productsArr = cartData.products;
    var position;

    for (x in productsArr) {
        let item = productsArr[x];
        if (item.id == params.id) {
            position = x;
        }
    }


    if (position === undefined) {
        return res.send({
            success: 0,
            message: "could not delete"
        })
    }
    //const product_id = productsArr.products[params.position].id
    //const deleted_qty = productsArr.products[params.position].qty
    productsArr.splice(position, 1);

    const updatedSum = await updateSum(productsArr)
    var newvalues = {
        $set: {
            products: productsArr
        }
    };
    var refreshedArr = await CartModel.updateOne(findCriteria, newvalues)
        .catch(err => {
            return {
                success: 0,
                message: 'could not delete the cart',
                error: err
            }
        })
    // const updatedProdcut = await updateProduct(product_id,deleted_qty,2)

    // if (updatedProdcut != 1){
    //     return res.send({
    //         msg:"some thing went wrong",
    //         success:0,
    //         code: updatedProdcut
    //     })
    // }


    if (refreshedArr) {
        return res.send({
            message: "deleted",
            success: 1

        })
    }
}

exports.updateQty = async (req, res) => {

    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    //let cartModifier = await updateCart(userId);

    if (!params) {
        return res.send({
            msg: "no parameters found",
            success: 0
        })
    }

    if (!params.id) {
        return res.send({
            message: "no value for product found",
            success: 0
        })
    }
    if (!params.plus) {
        return res.send({
            message: "no indication about operation found",
            success: 0
        })
    }


    let findCriteria = {};

    findCriteria.owner = userId;
    findCriteria.status = 1;
    findCriteria.deliveryStatus = "active";

    var cartData = await CartModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cartData) {
        return res.send('no products');

    }
    var productsArr = cartData.products;
    var position;
    for (x in productsArr) {
        let item = productsArr[x];
        if (item.id == params.id) {
            position = x;
        }
    }
    if (position == undefined) {
        return res.send("not found");
    }


    var currentqty = productsArr[position].qty;
    var flag = 2
    if (params.plus == 1) {
        flag = 1;
        currentqty = currentqty + 1;
    } else {
        currentqty = currentqty - 1;
    }

    if (currentqty < 1) {
        return res.send("negative qty not allowed")
    }



    productsArr[position].qty = currentqty;

    //const productid = productsArr.products[params.position ].id;


    //const productUpdate = await updateProduct(productid,1,flag);

    // if (productUpdate == 0){
    //     return res.send({
    //         msg: "something went wrong",
    //         success:0,
    //         code:productUpdate
    //     })
    // }

    const updatedSum = updateSum(productsArr)
    // var newvalues = { $set: {products: productsArr.products } ,Sum:updatedSum};
    var newvalues = {
        products: productsArr,
        Sum: updatedSum
    };
    var refreshedArr = await CartModel.updateOne(findCriteria, newvalues)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })


    if (refreshedArr) {
        return res.send({
            msg: "updated",
            success: 1

        })
    }
}

async function updateProduct(id, newqty, plus) {

    let findCriteria = {};
    var set_Outofstock = false;

    findCriteria._id = id;
    var data = await productModel.findOne(findCriteria).catch(err => {
        return 2;
    })
    console.log("1");

    if (!data) {
        console.log("2");
        return 3
    }
    var currentqty = data.qty;
    if (plus == 1) {
        currentqty = currentqty - newqty
    } else {
        currentqty = currentqty + newqty
    }

    if (currentqty == 0) {

        set_Outofstock = true
    }
    console.log("3");
    if (currentqty < 0) {
        return 4;
    }
    console.log("4");
    console.log(currentqty);
    var updated = await productModel.updateOne(findCriteria, {
        qty: currentqty,
        out_of_stock: set_Outofstock
    }).catch(err => {
        return 5;
    });
    console.log("5");
    if (!updated) {
        return 6;
    }
    console.log(data.qty);
    return 1;

}



async function updateCart(id) {

    let findCriteria = {};

    findCriteria.owner = id;
    findCriteria.status = 1;

    var cartData = await CartModel.findOne(findCriteria)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err.message
            }
        })

    if (!cartData) {
        return 1
    }

    const products = cartData.products
    var productArray = [];
    var items = [];
    var sum = 0.0;
    for (each in products) {

        if (products[each].id) {
            productArray.push(products[each].id)
        } else {
            productArray.push("0")
        }
    }

    var sum = 0.0;
    for (each in productArray) {
        let findCriteria1 = {};
        findCriteria1._id = productArray[each];
        findCriteria1.status = 1;

        var filter = {};

        filter.price = 1;
        filter.name = 1;
        filter.discount = 1;

        filter._id = 0
        let data = await productModel.findOne(findCriteria1, filter)
            .catch(err => {
                console.log(err.message);
            })

        if (data) {
            data.qty = products[each].qty;
            items.push(data);
            var pointNum = parseFloat(data.price);
            const price_after_discount = ((100 - pointNum) * sum) / 100;
            sum = sum + price_after_discount * products[each].qty;
        } else {
            console.log("no data found");

        }

    }

    let cartUpdate = await CartModel.updateOne({
        _id: cartData._id
    }, {
        products: items,
        Sum: 100
    }


    )

    return 1;

}

exports.showByDate = async (req, res) => {

    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    if (!params) {
        return res.send({
            msg: "no parameters found",
            success: 0
        })
    }


    const page = params.page || 1;
    if (page < 1) {
        page = 1;
    }
    const size = params.size || 10;
    if (size < 1) {
        size = 10;
    }

    let findCriteria = {};

    findCriteria.owner = userId;
    findCriteria.status = 1;
    findCriteria.tSCreatedAt = {
        $gt: params.startDate,
        $lt: params.endDate
    }

    var cartArray = await CartModel.findOne({
        tSCreatedAt: {
            $gt: params.startDate,
            $lt: params.endDate
        }
    }).skip(size * (page - 1)).limit(size)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cartArray) {
        return res.send('no products');

    }

    if (cartArray) {
        return res.send({
            msg: "updated",
            success: 1,
            item: cartArray
        })
    }
}

exports.showByAmt = async (req, res) => {

    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;

    if (!params) {
        return res.send({
            msg: "no parameters found",
            success: 0
        })
    }

    const page = params.page || 1;
    if (page < 1) {
        page = 1;
    }
    const size = params.size || 10;
    if (size < 1) {
        size = 10;
    }
    let findCriteria = {};

    findCriteria.owner = userId;
    findCriteria.status = 1;
    findCriteria.tSCreatedAt = {
        $gt: params.startDate,
        $lt: params.endDate
    }

    var cartArray = await CartModel.findOne({
        Sum: {
            $gt: params.amount

        }
    }).skip(size * (page - 1)).limit(size)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cartArray) {
        return res.send('no products');

    }
    if (cartArray) {
        return res.send({
            msg: "updated",
            success: 1,
            item: cartArray
        })
    }
}

exports.history = async (req, res) => {

    var params = req.params;
    let userDataz = req.identity.data;
    let userId = userDataz.id;


    let filter = {};

    filter.owner = userId;
    filter.active = false;


    var projection = {
        Sum: 1,

        tSCreatedAt: 1,
        deliveryStatus: 1
    }
    var page = params.page || 1;
    page = page > 0 ? page : 1;
    var perPage = Number(params.perPage) || 30;
    perPage = perPage > 0 ? perPage : 30;
    var offset = (page - 1) * perPage;
    var pageParams = {
        skip: offset,
        limit: perPage
    };

    var cartArray = await CartModel.find(filter, projection, pageParams)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cartArray) {
        return res.send('no products');

    }


    var itemsCount = await cartModel.countDocuments(filter);
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
    if (cartArray) {
        return res.send({
            pagination,
            msg: "updated",
            success: 1,
            item: cartArray
        })
    }
}

exports.cancelOrder1 = async (req, res) => {

    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;


    let filter = {};

    filter.owner = userId;
    // filter.status = 1;
    filter.deliveryStatus = "order_placed";
    filter._id = params.id



    var cart = await CartModel.updateOne(filter, { deliveryStatus: "cancelled", status: 0 })
        .catch(err => {
            return res.send({
                success: 0,
                message: 'did not get cart for the user',
                error: err
            })
        })

    if (!cart) {
        return res.send('no products');

    }



    if (cart) {
        return res.send({

            success: 1,
            message: "order cancelled"
        })
    }
}


exports.repeat = async (req, res) => {

    var params = req.body;
    let userDataz = req.identity.data;
    let userId = userDataz.id;


    let filter = {};


    filter.status = 0;

    filter._id = params.id



    var cart = await CartModel.updateOne(filter, { deliveryStatus: "order_placed", status: 1, $inc: { repeatCount: 1 } })
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cart) {
        return res.send('no products');

    }



    if (cart) {
        return res.send({

            success: 1,
            message: "order placed"
        })
    }
}

exports.getOrder = async (req, res) => {

    var params = req.query;
    let userDataz = req.identity.data;
    let userId = userDataz.id;


    let filter = {};




    filter._id = params.id

    var projection = {
        Sum: 1,
        products: 1,
        deliveryStatus: 1,
        deliveryAddress: 1,
        tSCreatedAt: 1
    }

    var cart = await CartModel.findOne(filter, projection)
        .catch(err => {
            return {
                success: 0,
                message: 'did not get cart for the user',
                error: err
            }
        })

    if (!cart) {
        return res.send('no products');

    }



    if (cart) {
        return res.send({

            success: 1,
            item: cart,
            message: "order displayed"
        })
    }
}

