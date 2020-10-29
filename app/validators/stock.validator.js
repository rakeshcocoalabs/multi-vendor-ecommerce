var Products = require('../models/product.model');
var Variants = require('../models/variant.model');


module.exports = {
    checkProductsStock: async function (products) {
        var outOfStock = false;
        var outOfStockProductsCount = 0;
        await Promise.all(products.map(async (item, i) => {
            if(item.isVariant){
                if(item.quantity > item.variantId.stockAvailable){
                    outOfStock = true;
                    outOfStockProductsCount = outOfStockProductsCount + 1;
                }

            }else{
                if(item.quantity > item.productId.stockAvailable){
                    outOfStock = true;
                    outOfStockProductsCount = outOfStockProductsCount + 1;
                }
            }
        }));
        var response = {};
        if(outOfStock){
            response.success = 0;
            if(outOfStockProductsCount > 1){
              response.message = 'Multiple products outofstock';
            }else{
              response.message = 'One product outofstock';
            }
        }else{
            response.success = 1;
            response.message = 'Validated';
        }
        return response;
      
    }
   
}

async function checkVarientStock(varientIdArray){
        
}
