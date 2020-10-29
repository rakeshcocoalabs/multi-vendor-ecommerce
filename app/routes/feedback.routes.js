const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const feedback = require('../controllers/feedback.controller');

    app.post('/feedback/create',auth,feedback.create);
   
    
}