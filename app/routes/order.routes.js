const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const order = require('../controllers/order.controller');

    app.post('/order/checkout',auth,order.checkout);
    app.get('/order/list',auth,order.listOrders);
    app.get('/order/:id/detail',auth,order.getOrderDetail);
    app.patch('/order/:id/cancel',auth,order.cancelOrder);

    app.post('/order/showbydate',auth, order.showByDate);
    app.post('/order/showbyamt',auth,order.showByAmt);
    app.get('/order/history',auth,order.history);
    app.post('/order/repeat',auth,order.repeat);
    app.get('/order/getorder',auth,order.getOrder);
}
