const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../models/users");
const fetchUser = require("../middleware/fetch_user");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET; // Use environment variable for production
const { OAuth2Client, auth } = require("google-auth-library");


const EMAIL_SECRET = process.env.EMAIL_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const BASE_URL = process.env.BASE_URL;


// ------------------- User creation -----------------------
router.post(
  "/create-user",
  [
    body("first_name","please Enter a valid name").isEmpty().isLength({min:1,max:20  }),
    body("last_name","please Enter a valid name").isEmpty().isLength({min:1,max:20  }),
    body("username", "Username must be at least 3 characters long").isLength({
      min: 3,
    }),
    body('username',"Username limit exeeded").isLength({
      max:20,
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
    if (user && user.auth_type !== 'google') {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    if (!user) {
      // Create the user
      user = await User.create({
        first_name:payload.given_name,
        last_name:payload.family_name,
        username:'',
        profile_img:payload.picture,
        email:payload.email,
        email_verified:payload.email_verified,
        auth_type:'google',
        password: '',
        mobile:'',
      });
      // Generate a JWT token
      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ auth_token });
    }else{
        if(user.auth_type !=='google')return res.status(400).json({error:"Internal Server error Occured."});
        // Generate a JWT token
      const auth_token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      // console.log(user);
      res.json({auth_token});

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
  if(!token){
    return res.status(400).json({error:"Invalid token"});
  }
  const user_id = jwt.verify(token, JWT_SECRET).id;
  try {
    const user = await User.findById(user_id).select("-password -__v -_id -createdAt -updatedAt -auth_type");
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
    const user = await User.findById(user_id).select("-password -__v -_id -createdAt -updatedAt -auth_type -type");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error occurred");
  }
});


// ----------------------------Email Verification ---------------------------------
// ----------------------------Sending Email --------------------------------------


// ----------------------------Mobile Verification ---------------------------------




module.exports = router;
