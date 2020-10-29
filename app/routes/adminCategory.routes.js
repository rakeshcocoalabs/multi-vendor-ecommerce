const auth = require('../middleware/adminAuth.js');
var config = require('../../config/app.config.js');
var multer = require('multer');
var mime = require('mime-types');
var categoryConfig = config.categories;


var storage = multer.diskStorage({
    destination: categoryConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});

var ImageUpload = multer({ storage: storage });
module.exports = (app) => {
    const category = require('../controllers/adminCategory.controller');
    
  
    app.post('/admincategory/create', auth,ImageUpload.single('image'), category.create);
    app.get('/admincategory/list', auth, category.list);
    app.patch('/admincategory/update', auth, category.update);
    app.delete('/admincategory/delete', auth, category.delete);

}