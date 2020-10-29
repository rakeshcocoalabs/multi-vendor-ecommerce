const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const code = require('../controllers/promocode.controller');

    app.post('/promocode/create',auth, code.create);
    
}