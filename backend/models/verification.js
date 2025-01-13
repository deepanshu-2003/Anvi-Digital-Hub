const Mongoose  = require("mongoose");

const VerificationSchema = Mongoose.Schema({
    userId:{
        type: String,
        require: true
    },
    type:{
        type:String,
        default: "email"
    },
    email:{
        type: String,
    },
    mobile:{
        type:String,
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
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // TTL index: Document expires after 3600 seconds (1 hour)
    },

});

module.exports = Mongoose.model('verify',VerificationSchema);