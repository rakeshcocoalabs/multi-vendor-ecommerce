const auth = require('../middleware/auth.js');
var multer = require('multer');
var mime = require('mime-types');
var config = require('../../config/app.config.js');
var bannerConfigConfig = config.banners;
var productConfigConfig = config.products;

var storage = multer.diskStorage({
    destination: bannerConfigConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});
var storage1 = multer.diskStorage({
    destination: productConfigConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});
var bannerImageUpload = multer({ storage: storage });
var prodImageUpload = multer({ storage: storage1 });
module.exports = (app) => { 
    const product = require('../controllers/product.controller');
    
    app.post('/product/banners/create',bannerImageUpload.single('image'), product.createBanner);
    app.get('/product/home',auth, product.home);
   // app.get('/product/list',auth, product.list);
   // app.post('/product/listbyfilter',auth, product.listByFilter);
    app.post('/product/listbycategory',auth, product.listByCategory);
  //  app.post('/product/add',auth,product.add);
    app.post('/product/update',auth, product.update);
    app.post('/product/addImage',prodImageUpload.single('image'), product.addImage);
    app.post('/product/remove',auth,product.remove);
    app.get('/product/search',auth, product.search);
    app.get('/product/:id/details',auth, product.details);
    app.post('/product/variants',auth, product.listVariants);

    app.get('/product/reviews', product.reviews);
    app.get('/product/stocks', product.stocks);
    app.patch('/product/stocks/:id/edit',product.editStock);
    app.delete('/product/stocks/:id/delete',product.deleteStock);


    //app.get('/product/:id/listchildproducts',auth, product.chuildProducts);
   // app.get('/product/sellers',auth, product.listSellers);
    app.get('/product/searchseller',auth, product.seachSellers);
}