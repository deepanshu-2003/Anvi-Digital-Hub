const mongoose = require('mongoose');

const MetaUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verified:{
        type:Boolean,
        require:true
    },
    profession: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('MetaUser', MetaUserSchema);