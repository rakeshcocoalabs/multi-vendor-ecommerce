const auth = require('../middleware/adminAuth.js');

var multer = require('multer');
var mime = require('mime-types');
var config = require('../../config/app.config.js');
var vendorConfigConfig = config.vendors;


var storage = multer.diskStorage({
    destination: vendorConfigConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});
var vendorImageUpload = multer({ storage: storage });
module.exports = (app) => { 
    const admin = require('../controllers/admin.controller');
    
    app.post('/admin/create',auth,admin.create);
    app.post('/admin/login',admin.login);
    app.post('/admin/add',auth,admin.addUser);
   // app.get('/admin/list',admin.addUser);
    app.get('/admin/userlist',auth,admin.list)
    app.get('/admin/reviews',auth,admin.reviewlist)
    app.get('/admin/dashboard',auth,admin.dashBoardDetails);


    app.post('/admin/createvendor',vendorImageUpload.single('image'),auth,admin.createVendor);
}