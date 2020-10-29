const auth = require('../middleware/deliveryAuth.js');
module.exports = (app) => { 
    const delivery = require('../controllers/appDeliveryPartner.controller');

    app.post('/appDeliveryPartner/login', delivery.login);
    app.get('/appDeliveryPartner/list',auth,delivery.list);
    app.get('/appDeliveryPartner/search',auth,delivery.search);
    app.patch('/appDeliveryPartner/update',auth,delivery.update); 
    app.post('/appDeliveryPartner/orderdetail',auth,delivery.getOrderDetail); 
    app.post('/appDeliveryPartner/verifyotp',delivery.verifyOtp); 
}
