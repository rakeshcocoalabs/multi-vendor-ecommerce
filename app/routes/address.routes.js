const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const address = require('../controllers/address.controller');

    app.post('/address/create',auth, address.create);
    app.get('/address/list',auth, address.list);
    app.patch('/address/setdefault',auth, address.setdefault);
    app.patch('/address/update',auth, address.update);
    app.delete('/address/remove',auth, address.remove);
}