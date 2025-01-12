const Mongoose = require('mongoose');
const CouseSchema = Mongoose.Schema({
    course_name: {
        type:String,
        require:true
    },
    course_desc:{
        type:String,
        require:true
    },
    course_price:{
        type:String,
        require:true
    },
    course_discount:{
        type:String,
        require:true
    },
    course_img:{
        type:String,
        require:true
    },
    course_duration:{
        type:String,
        require:true
    },
    course_created:{
        type:Date,
        default:Date.now
    },
    course_status:{
        type:String,
        default:'active'
    }

})

module.exports = Mongoose.model('courses',CouseSchema);