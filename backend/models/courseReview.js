const mongoose = require('mongoose');

const CourseReviewsSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'courses',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true
    },
    review_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('courseReviews', CourseReviewsSchema);
