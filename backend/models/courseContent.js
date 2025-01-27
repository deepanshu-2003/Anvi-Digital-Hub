const mongoose = require('mongoose');

const CourseContentSchema = mongoose.Schema({
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
    file_type: {
        type: String,
        required: true,
        default:'dir'
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'courseContent',
        default: null // default to null for root documents
    },
    file: {
        type: String
    },
    visibility: {
        type: String,
        default: "public"
    }
});

module.exports = mongoose.model('courseContent', CourseContentSchema);
