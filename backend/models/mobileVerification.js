const mongoose = require("mongoose");


const MobileVerificationSchema = mongoose.Schema({
    mobile:{
        type: String,
        unique: true,
    },
    OTP:{
        type:String,
        require:true
    },
    verified:{
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // TTL index: Document expires after 600 seconds (10 minutes)
    },
})

module.exports = mongoose.model('mobileVerification',MobileVerificationSchema);