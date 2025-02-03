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
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    address: {
        type: String,
    },
    postalCode: {
        type: String,
    },
    country: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('MetaUser', MetaUserSchema);