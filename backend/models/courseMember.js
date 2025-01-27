const mongoose = require('mongoose');

const { Schema } = mongoose;

const courseMemberSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

module.exports = mongoose.model('CourseMember', courseMemberSchema);