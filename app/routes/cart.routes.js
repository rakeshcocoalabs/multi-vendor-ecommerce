const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const cart = require('../controllers/cart.controller');

    app.post('/cart/add',auth, cart.addToCart);
    app.delete('/cart/delete',auth, cart.deleteCartItem);
    app.patch('/cart/update',auth, cart.updateCart);
    app.get('/cart/show',auth, cart.showCart);
    app.get('/cart/count',auth, cart.getCartCount);

}
