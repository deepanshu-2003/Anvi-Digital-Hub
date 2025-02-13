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
        default:'dir',
        enum: ['dir', 'video', 'pdf']
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'courseContent',
        default: null // default to null for root documents
    },
    fileName: {
        type: String,
        default: null
    },
    destination: {
        type: String,
        default: null
    },
    visibility: {
        type: String,
        default: "public",
        enum: ['public', 'private']
    }
});

module.exports = mongoose.model('courseContent', CourseContentSchema);
