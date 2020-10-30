const auth = require('../middleware/adminAuth.js');
module.exports = (app) => { 
    const delivery = require('../controllers/adminDeliveryPartner.controller');

    app.post('/admindeliverypartner/create',auth, delivery.create);
    app.get('/admindeliverypartner/list',auth,delivery.list);
    app.patch('/admindeliverypartner/:id/update',auth,delivery.update);
    app.delete('/admindeliverypartner/:id/remove',auth,delivery.delete);
    app.post('/admindeliverypartner/:id/assign',auth, delivery.assign);
   
}
