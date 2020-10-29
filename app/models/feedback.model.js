const mongoose = require('mongoose');


const feedback = mongoose.Schema({
    feedback_message: String,
    user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
    },
    
   
    status: Number,
    tSCreatedAt: Number,
    tSModifiedAt: Number

})
module.exports = mongoose.model('Feedback', feedback, "Feedbacks");