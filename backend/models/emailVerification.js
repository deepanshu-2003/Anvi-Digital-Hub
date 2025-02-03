const Mongoose  = require("mongoose");

const EmailVerificationSchema = Mongoose.Schema({
    userId:{
        type: String,
        require: true,
        unique:true
    },
    email:{
        type: String,
        unique: true,
    },
    email_verified:{
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // TTL index: Document expires after 3600 seconds (1 hour)
    },

});

module.exports = Mongoose.model('emailVerification',EmailVerificationSchema);