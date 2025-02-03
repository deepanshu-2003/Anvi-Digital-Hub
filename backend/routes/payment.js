const express = require("express");
const Razorpay = require("razorpay");
const Payment = require("../models/payment"); // Import Payment model
const User = require("../models/users");
const Course = require("../models/courses");
const { check, validationResult} = require("express-validator");
const jwt = require("jsonwebtoken");
const Member = require("../models/courseMember");
const MetaUser = require("../models/metaUser");

const router = express.Router();
require("dotenv").config();
const {
  PAYMENT_APP_ID: RAZORPAY_KEY_ID,
  PAYMENT_SECRET_KEY: RAZORPAY_KEY_SECRET,
  JWT_SECRET
} = process.env;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Endpoint to initiate payment
router.post(
  "/initiate",
  [
    check("course_id", "Invalid course purchase request.")
      .not()
      .isEmpty()
      .isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { course_id } = req.body;
      const course = await Course.findById(course_id);
      if (!course)
        return res.status(401).json({ error: "Course ID is not correct" });
      const token = req.header("auth_token");
      if (!token)
        return res.status(401).json({ error: "Unauthorized Accesss" });
      const user_id = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(user_id.id);
      if (!user) return res.status(401).json({ error: "Unauthorized Accesss" });
      const orderAmount = course.course_price - course.course_discount;
      const options = {
        amount: orderAmount * 100, // Amount in paise
        currency: "INR",
        receipt: `order_${course_id}`,
        payment_capture: 1, // Automatic capture
      };
      const response = await razorpay.orders.create(options);
      const newPayment = new Payment({
        orderId: response.id,
        paymentId: "PAYMENT_ID",
        user: user_id.id, 
        course: course_id, 
        amount: orderAmount,
        currency: "INR",
        status: "failed",
        customerEmail: user.email,
        customerPhone: user.mobile,
      });

      await newPayment.save();
      console.log(response);
      return res.status(200).json({
        id: response.id,
        currency: response.currency,
        amount: response.amount,
        key: RAZORPAY_KEY_ID, // Include the key in the response for the frontend
      });
    } catch (error) {
      console.error("Error initiating payment:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Endpoint to handle payment response
router.post("/response", async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    status,
  } = req.body;

  try {
    // Save payment details in the database
    const payment = await Payment.findOne({orderId:razorpay_order_id});
    if(!payment) return res.status(400).json({error:"Technical error occured."})
    const user = payment.user;
    const course = payment.course;
    payment.status = status;
    payment.paymentId = razorpay_payment_id;

    await payment.save();
    // ---------- Additional Information regarding the course -------------
    const metaUser = await MetaUser.findOne({user:user});
    if(!metaUser) return res.status(400).json({error:"Technical error occured."});
    const newMember = new Member({
        user:user,
        course:course,
        address:metaUser.address,
        city:metaUser.city,
        state:metaUser.state,
        postalCode:metaUser.postalCode,
        country:metaUser.country,
        profession:metaUser.profession,
        expiryDate:null,
    });
    await newMember.save();
    return res.status(200).json({
      message: "Payment response received and recorded",
      data: payment,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




module.exports = router;
