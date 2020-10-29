
const auth = require('../middleware/auth.js');
var multer = require('multer');
var mime = require('mime-types');
var config = require('../../config/app.config.js');
var profileConfig = config.user;


var storage = multer.diskStorage({
    destination: profileConfig.imageUploadPath,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + "." + mime.extension(file.mimetype))
    }
});
var userImageUpload = multer({ storage: storage });

module.exports = (app) => { 
    const user = require('../controllers/user.controller');

    app.post('/user/create',user.create);
    app.post('/user/login',user.login);
    app.post('/user/addfavourite',auth, user.addFavourite);
    app.patch('/user/update',auth, userImageUpload.single('image'),user.update);
    app.delete('/user/removefavourite',auth,user.removeFavourite);
    app.delete('/user/removeallfavourite',auth,user.removeAllFavourites);
    app.get('/user/profile',auth,user.show);
    app.get('/user/wishlist',auth,user.favouritesList);
    app.post('/user/forgotpassword',user.fotgotpassword);
    app.post('/user/verifyotp',user.verifyOtp);
    app.post('/user/resetpassword',user.resetPassword);
    app.get('/user/filters',user.filtersList);
    app.get('/user/notification/list',auth,user.notificationList);
    app.post('/user/sendnotification',user.sendNotification);
    app.get('/users/list',user.list);
    app.patch('/users/:id/block-delete',user.blockOrDelete);
}