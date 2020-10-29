const auth = require('../middleware/auth.js');
module.exports = (app) => { 
    const review = require('../controllers/review.controller');

    app.post('/review/create',auth,review.create);
    app.get('/review/list',auth, review.list);
    
}