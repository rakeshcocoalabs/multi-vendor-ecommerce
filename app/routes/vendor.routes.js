const auth = require('../middleware/vendorAuth.js');
var config = require('../../config/app.config.js');
var multer = require('multer');
var mime = require('mime-types');
var productsConfig = config.products;


var storage = multer.diskStorage({
    destination: productsConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});

var ImageUpload = multer({ storage: storage });
module.exports = (app) => { 
    const vendor = require('../controllers/vendor.controller');

  
    app.post('/vendor/createproducts',auth, ImageUpload.fields([{name:'images'}]), vendor.createProduct);
    app.get('/vendor/searchproducts', auth, vendor.search);
    app.get('/vendor/dashboard', auth, vendor.getDashBoard);
    app.patch('/vendor/:id/updateproducts', auth, vendor.updateProduct);
    app.delete('/vendor/:id/deleteproducts', auth, vendor.deleteProduct);
    app.get('/vendor/reviews',auth,vendor.reviewlist)
    app.get('/vendor/stocklist',auth,vendor.stockList)
    app.post('/vendor/login',vendor.login);
    app.post('/vendor/add_devivery_agent',auth,vendor.add_devivery_agent);
    app.get('/vendor/profile',auth, vendor.show);
    

}