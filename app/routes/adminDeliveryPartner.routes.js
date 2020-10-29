const auth = require('../middleware/adminAuth.js');
module.exports = (app) => { 
    const delivery = require('../controllers/adminDeliveryPartner.controller');

    app.post('/adminDeliveryPartner/create',auth, delivery.create);
    app.get('/adminDeliveryPartner/list',auth,delivery.list);
    app.patch('/adminDeliveryPartner/update',auth,delivery.update);
    app.delete('/adminDeliveryPartner/remove',auth,delivery.delete);
    app.post('/adminDeliveryPartner/assign',auth, delivery.assign);
   
}
