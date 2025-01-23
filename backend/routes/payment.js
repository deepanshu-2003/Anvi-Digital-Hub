const express = require('express');
const Razorpay = require('razorpay');
const Payment = require('../models/payment'); // Import Payment model

const router = express.Router();
require('dotenv').config();

const { PAYMENT_APP_ID: RAZORPAY_KEY_ID, PAYMENT_SECRET_KEY: RAZORPAY_KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

// Endpoint to initiate payment
router.post('/initiate', async (req, res) => {
    const { orderId, orderAmount } = req.body;

    const options = {
        amount: orderAmount * 100, // Amount in paise
        currency: 'INR',
        receipt: orderId,
        payment_capture: 1, // Automatic capture
    };

    try {
        const response = await razorpay.orders.create(options);
        return res.status(200).json({
            id: response.id,
            currency: response.currency,
            amount: response.amount,
            key: RAZORPAY_KEY_ID // Include the key in the response for the frontend
        });
    } catch (error) {
        console.error('Error initiating payment:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to handle payment response
router.post('/response', async (req, res) => {
    const { orderId, amount, currency, razorpay_payment_id, razorpay_order_id, status } = req.body;

    try {
        // Save payment details in the database
        const payment = new Payment({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount,
            currency,
            status,
            customerEmail: "customer@example.com", // Replace with actual customer email
            customerPhone: "1234567890" // Replace with actual customer phone
        });

        await payment.save();

        return res.status(200).json({ message: 'Payment response received and recorded', data: payment });
    } catch (error) {
        console.error('Error recording payment:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
