const Mongoose = require('mongoose');
const CourseSchema = Mongoose.Schema({
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
    course_expiry:{
        type:Number,
        default:6
    },
    course_expiry_type:{
        type:String,
        default:"Months",
        emum:["Days","Months","Years"]
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

module.exports = Mongoose.model('courses',CourseSchema);