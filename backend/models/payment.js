const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    paymentId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User schema
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Reference to Course schema
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true }
});

module.exports = mongoose.model('Payment', paymentSchema);
