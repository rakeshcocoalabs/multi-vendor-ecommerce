const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const delivery = require('../controllers/delivery.controller');

    app.get('/delivery/list',auth, delivery.list);
    app.post('/delivery/login',delivery.login);
    app.post('/delivery/verifyotp',delivery.verifyOtp);
    app.post('/delivery/assign',delivery.assign);
    app.post('/delivery/picked',delivery.picked);
}
