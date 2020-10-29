const mongoose = require('mongoose');


const cart = mongoose.Schema(
    {

        orderNo: String,
        userId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        deliveryAddress: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Address'
        },
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                isVariant: Boolean,
                variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
                shopOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
                quantity: Number,
                price: Number,
                totalPrice: Number,
                variant: String,
                isReviewable : Boolean,
                status: Number,
                tsCreatedAt: Number,
                tsModifiedAt: Number,
            }
        ],
        statusHistory: [{
            sortOrder: Number,
            orderStatus: String,
            datetime: Number,
            isCompleted: Boolean
        }],

        deliveryStatus: String,
        active: Boolean,
        assignee: {
            type: mongoose.Schema.Types.ObjectId, ref: 'deliveryAgent'
        },
        deliveredAt: Number,
        pickedAt: Number,
        orderStatus: String,
        paymentMethod:String,
        isConvertedToOrder: Boolean,
        shopName : String,
        fromAddress : {
            DoorNo : String,
            name : String,
            Street : String,
            Town : String
        },
        
       
        subTotal: Number,
        deliveryCharge: Number,
        discount: Number,
        grandTotal: Number,
        isCancellable: Boolean,
        isCancelled: Boolean,
        isDelivered: Boolean,
        orderDate: Number,
        tsCreatedAt: Number,
        tsModifiedAt: Number,
        status: Number


    }
)
module.exports = mongoose.model('Cart', cart, "Carts");