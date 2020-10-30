const auth = require('../middleware/adminAuth.js');
var config = require('../../config/app.config.js');
var multer = require('multer');
var mime = require('mime-types');
var categoryConfig = config.categories;



module.exports = (app) => {
    const order = require('../controllers/adminOrder.controller');
    
  
    
    app.get('/adminorder/list', auth, order.list);
    app.patch('/adminorder/:id/update', auth, order.update);

}