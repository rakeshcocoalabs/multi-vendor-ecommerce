const auth = require('../middleware/auth.js');
// const adminAuth = require('../middleware/adminAuth.js');
// var config = require('../../config/app.config.js');
// var bannerConfigConfig = config.banners;
// var productConfigConfig = config.products;

// var storage = multer.diskStorage({
//     destination: bannerConfigConfig.imageUploadPath,
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
//     }
// });
// var storage1 = multer.diskStorage({
//     destination: productConfigConfig.imageUploadPath,
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
//     }
// });
module.exports = (app) => {
    const category = require('../controllers/categories.controller');
    //var bannerImageUpload = multer({ storage: storage });
    // app.post('/admin/categories/create',auth, category.createCategory);
    app.get('/categories/list', auth, category.list);
    app.post('/categories/add', auth, category.create);
    app.post('/categories/subcategories', auth, category.subcategories);

}