const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true }
});

module.exports = mongoose.model('Payment', paymentSchema);
