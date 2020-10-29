const auth = require('../middleware/adminAuth.js');
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
    const products = require('../controllers/adminProducts.controller');
    
  
    app.post('/adminproducts/create',auth, ImageUpload.fields([{name:'images'}]), products.create);
    app.get('/adminproducts/search', auth, products.search);
    app.patch('/adminproducts/update', auth, products.update);
    app.delete('/adminproducts/:id/delete', auth, products.delete);
    
    app.post('/adminProducts/variant', auth, products.addVariant);
    app.get('/adminProducts/variant/:id/detail', auth, products.getVariantDetail);
    app.patch('/adminProducts/variant/:id/update', auth, products.updateVariant);
    app.delete('/adminProducts/variant/:id/delete', auth, products.deleteVariant);
    app.get('/adminProducts/:id/variant/list', auth, products.listVariants);

}