const Mongoose  = require("mongoose");

const UserSchema = Mongoose.Schema({
    first_name:{
        type: String,
        require: true
    },
    last_name:{
        type: String
    },
    profile_img:{
        type: String,
        default: "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"
    },
    profile_img_type:{
        type: String,
        default: "url"
    },
    username:{
        type: String,
        require: true,
        unique: true
    },
    type:{
        type: String,
        default: "user" // default as user else admin user
    },
    auth_type:{
        type: String,
        default: "manual"
    },
    password:{
        type: String,
        require: true
    },
    email:{
        type: String,
        require: true
    },
    email_verified:{
        type: Boolean,
        default: false
    },
    mobile:{
        type: String,
        require: true
    },
    mobile_verified:{
        type: Boolean,
        default: false
    },
    date:{
        type: Date,
        default: Date.now
    },

});

module.exports = Mongoose.model('user',UserSchema);