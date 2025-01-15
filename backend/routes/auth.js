const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../models/users");
const fetchUser = require("../middleware/fetch_user");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Verify = require("../models/verification");

const JWT_SECRET = process.env.JWT_SECRET; // Use environment variable for production
const { OAuth2Client, auth } = require("google-auth-library");

const EMAIL_SECRET = process.env.EMAIL_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const BASE_URL = process.env.BASE_URL;

// random user id generation----------------------------------------------
function generateRandomUsername() {
  const adjectives = [
    "Brave",
    "Clever",
    "Witty",
    "Happy",
    "Gentle",
    "Quick",
    "Bright",
    "Bold",
    "Calm",
    "Lively",
  ];
  const nouns = [
    "Lion",
    "Tiger",
    "Panda",
    "Falcon",
    "Fox",
    "Eagle",
    "Bear",
    "Wolf",
    "Dragon",
    "Shark",
  ];

  // Generate random indices
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 10000); // Random number from 0 to 9999

  // Combine parts to form a username
  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

// ------------------- User creation -----------------------
router.post(
  "/create-user",
  [
    body("first_name", "please Enter a valid name")
      .notEmpty()
      .isLength({ min: 1, max: 20 }),
    body("last_name", "please Enter a valid name")
      .notEmpty()
      .isLength({ min: 1, max: 20 }),
    body("username", "Username must be at least 3 characters long").isLength({
      min: 3,
    }),
    body("username", "Username limit exeeded").isLength({
      max: 20,
    }),
    body("email", "Please enter a valid email").isEmail(),
    body("password", "Password must be at least 8 characters long").isLength({
      min: 8,
    }),
    body("mobile", "Please enter a valid 10-digit mobile number")
      .isNumeric()
      .isLength({ min: 10, max: 10 }),
    body("recaptchaToken", "Recaptcha token is required").notEmpty(), // Ensure recaptcha_token is provided
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        username,
        email,
        mobile,
        password,
        first_name,
        last_name,
        recaptchaToken,
      } = req.body;

      // Verify the reCAPTCHA token with Google's API
      const secretKey = process.env.SECRET_KEY; // Use environment variable for the secret key
      const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

      const recaptchaResponse = await fetch(recaptchaUrl, { method: "POST" });
      const recaptchaData = await recaptchaResponse.json();
      if (!recaptchaData.success) {
        return res.status(400).json({
          error: "Failed reCAPTCHA verification. Please try again.",
          details: recaptchaData["error-codes"],
        });
      }

      // Check if the username already exists
      let user = await User.findOne({ username });
      if (user) {
        return res
          .status(400)
          .json({ error: "User with this username already exists." });
      }

      // Check if the email already exists
      user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ error: "User with this email already exists." });
      }

      // Check if the mobile number already exists
      user = await User.findOne({ mobile });
      if (user) {
        return res
          .status(400)
          .json({ error: "User with this mobile number already exists." });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const secured_passwd = await bcrypt.hash(password, salt);

      // Create the user
      user = await User.create({
        first_name,
        last_name,
        username,
        email,
        password: secured_passwd,
        mobile,
      });

      // Generate a JWT token
      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ auth_token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error occurred");
    }
  }
);

//--------------------Validating Auth Token---------------------

router.post("/validate-token", async (req, res) => {
  const { auth_token } = req.body;
  if (!auth_token) {
    return res.status(400).json({ error: "Invalid token" });
  }

  try {
    const user = jwt.verify(auth_token, JWT_SECRET);
    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    res.json({ auth_token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error occurred");
  }
});

// ------------ Google Login ----------------------
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
router.post("/google-login", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Failed to continue with Google" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, // Match the client ID
    });
    const payload = ticket.getPayload();
    // console.log(payload);
    // Checking that if it is already exists
    let user = await User.findOne({ email: payload.email });
    if (user && user.auth_type !== "google") {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }
    if (!user) {
      // Create the user
      user = await User.create({
        first_name: payload.given_name,
        last_name: payload.family_name,
        username: "",
        profile_img: payload.picture,
        email: payload.email,
        email_verified: payload.email_verified,
        auth_type: "google",
        password: "",
        mobile: "",
      });
      // Generate a JWT token
      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ auth_token });
    } else {
      if (user.auth_type !== "google")
        return res
          .status(400)
          .json({ error: "Internal Server error Occured." });
      // Generate a JWT token
      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      // console.log(user);
      res.json({ auth_token });
    }
  } catch (err) {
    console.error("Error verifying Google token:", err.message);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// --------------- User login ----------------------
router.post(
  "/login",
  [
    body("username", "Username must be at least 3 characters long").isLength({
      min: 3,
    }),
    body("password", "Password must be at least 8 characters long").isLength({
      min: 8,
    }),
    body("recaptchaToken", "reCAPTCHA token is required").notEmpty(), // Ensure reCAPTCHA token is provided
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, recaptchaToken } = req.body;

    try {
      // Verify reCAPTCHA token with Google's API
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: process.env.SECRET_KEY, // Your secret key from environment variable
            response: recaptchaToken,
          }),
        }
      );
      const recaptchaResult = await recaptchaResponse.json();
      // console.log(recaptchaResult);

      if (!recaptchaResult.success) {
        return res
          .status(400)
          .json({ error: "Invalid reCAPTCHA. Please try again." });
      }

      // Find user by username
      let user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Prevent admin login
      if (user.type === "admin") {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate a JWT token
      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ auth_token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error occurred");
    }
  }
);

// ---------------- admin login ---------------------
router.post(
  "/login-admin",
  [
    body("username", "Username must be at least 3 characters long").isLength({
      min: 3,
    }),
    body("password", "Password must be at least 8 characters long").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    try {
      let user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      if (user.type !== "admin") {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate a JWT token

      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ auth_token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error occurred");
    }
  }
);

// --------------- Fetch Admin User---------------
router.post("/get-admin-user", fetchUser, async (req, res) => {
  const token = req.header("auth_token");
  if (!token) {
    return res.status(400).json({ error: "Invalid token" });
  }
  const user_id = jwt.verify(token, JWT_SECRET).id;
  try {
    const user = await User.findById(user_id).select(
      "-password -__v -_id -createdAt -updatedAt -auth_type"
    );
    if (user.type !== "admin") {
      return res.status(400).json({ error: "Unauthorized access" });
    }
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error occurred");
  }
});

// --------------- Fetch User ----------------------
router.post("/get-user", fetchUser, async (req, res) => {
  const user_id = req.user.id;
  try {
    const user = await User.findById(user_id).select(
      "-password -__v -_id -createdAt -updatedAt -auth_type -type"
    );
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error occurred");
  }
});

// ----------------------------Email Verification ---------------------------------
const transporter = nodemailer.createTransport({
  service: "Gmail", // or another email provider
  port: 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});
// ----------------------------Sending Email --------------------------------------

// endpoint for sending verification mail
// Endpoint for sending verification email
router.post(
  "/send-verification",
  [body("email", "Please enter a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    try {
      const already_present = await User.findOne({email});
      if(already_present) return res.status(404).json({
        errors: [
          {
            type: "field",
            value: "spdvldixit2003",
            msg: "Email is already Registered.",
            path: "email",
            location: "body"
          }
        ]
      });

      // Check if the email already exists in the verification database
      let user = await Verify.findOne({ email });
      let userId;

      if (user) {
        // Fetch existing userId
        userId = user.userId;
        if (user.email_verified) {
          return res.json({ message: "Email Verified successfuly." });
        }
      } else {
        // Generate a new userId for a new email
        userId = generateRandomUsername();

        // Save the new email and userId to the database
        user = new Verify({
          userId,
          email,
          verified: false,
          mobile_verified: false,
          mobile: "",
        });

        await user.save();
      }

      // Create a token for verification
      const token = jwt.sign({ userId }, EMAIL_SECRET, { expiresIn: "1h" });

      // Verification link
      const verificationLink = `${BASE_URL}/auth/verify-email?token=${token}`;

      // Email options
      const mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: "Email Verification",
        html: `
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link is valid for 1 hour.</p>
      `,
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Verification email sent successfully." });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({
        errors: [
          {
            type: "field",
            value: "spdvldixit2003",
            msg: "Failed to send verification email.",
            path: "email",
            location: "body"
          }
        ]
      }); 
    }
  }
);

//-------------------verifying email ----------------------------------------
// Endpoint for verifying email
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: "Invalid or missing token." });
  }
  // Email content templates
  const successHtml = (message = "Email Verified Successfully") => {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  </head>
  <body style="background-
  color: #f8f9fa; padding: 20px;">
    <div class="container text-center mt-5">
      <div class="card shadow-sm p-4">
        <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
        <h1 class="mt-3"> ${message} </h1>
        <p class="lead">Your email address has been successfully verified. Now you can proceed.</p>
        <a href= ${process.env.FRONTEND_URL} class="btn btn-primary mt-3">Go to Home</a>
      </div>
    </div>
  </body>
  </html>
`;
  };

  const failureHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Not Verified</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  </head>
  <body style="background-color: #f8f9fa; padding: 20px;">
    <div class="container text-center mt-5">
      <div class="card shadow-sm p-4">
        <i class="fas fa-times-circle text-danger" style="font-size: 4rem;"></i>
        <h1 class="mt-3">Email Verification Failed</h1>
        <p class="lead">We couldn't verify your email address. Please try again or contact support.</p>
        <a href= ${process.env.FRONTEND_URL}/contact class="btn btn-warning mt-3">Contact Support</a>
      </div>
    </div>
  </body>
  </html>
`;

  try {
    // Verify the token
    const decoded = jwt.verify(token, EMAIL_SECRET);
    const { userId } = decoded;

    // Find the user in the database
    const user = await Verify.findOne({ userId });
    if (!user) {
      return res.status(404).send(failureHtml);
    }

    // Update the user's verification status
    if (user.email_verified) {
      return res.status(200).send(successHtml("Email Already Verified"));
    }
    user.email_verified = true;
    await user.save();

    return res.status(200).send(successHtml("Email Verified successfully."));
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(400).send(failureHtml);
  }
});

// ----------------------------Mobile Verification ---------------------------------
const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
const authToken = `${process.env.TWILIO_AUTH_TOKEN}`;
const twilio_client = require('twilio')(accountSid, authToken);

router.post(
  "/verify-mobile",
  [
     body("mobile", "Please enter a valid 10-digit mobile number")
      .isNumeric()
      .isLength({ min: 10, max: 10 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await twilio_client.messages
    .create({
        body:"Hello Welcome to Anvi Digital Hub",
        from:"+16203776217",
        to: '+918930648848'
    })
    res.json({msg:"OTP Sent Successfully."});
    }catch(err){
      console.log("Error sending message",err);
      res.status(404).json({error:"Bas response."})
    }
  });




module.exports = router;
