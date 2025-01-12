const express = require("express");
const router = express.Router();
const Course = require("../models/courses");
const User = require("../models/users");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// @route - POST /course/add-course
// @desc - Add a new course
// @access - Public

// Course creation in database
const JWT_SECRET =process.env.JWT_SECRET;
router.post(
  "/create",
  [
    check("course_name", "Please enter a course name").not().isEmpty(),
    check("course_desc", "Please enter a course description").not().isEmpty(),
    check("course_price", "Please enter a course price").not().isEmpty(),
    check("course_discount", "Please enter a course discount").not().isEmpty(),
    check("course_img", "Please enter a course image").not().isEmpty(),
    check("course_duration", "Please enter a course duration").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const token = req.header("auth_token");
    if(!token){ return res.status(401).json({error: "Unauthorized Accesss"});}else{
        //verifying token from admin only
        try {
          console.log(token);
          const user_id = jwt.verify(token, JWT_SECRET);
            const usertype = await User.findById(user_id.id).select('type');
            if(usertype.type !== 'admin') return res.status(401).json({error: "Unauthorized Accesss"});
        } catch (error) {
            return res.status(401).json({error: "Unauthorized Accesss"});
        }
    }
    const {
      course_name,
      course_desc,
      course_price,
      course_discount,
      course_img,
      course_duration,
    } = req.body;

    try {
      const newCourse = new Course({
        course_name,
        course_desc,
        course_price,
        course_discount,
        course_img,
        course_duration,
      });

      const savedCourse = await newCourse.save();
      res.json(savedCourse);
    } catch (error) {
      console.error("Error adding course:", error.message);
      res.status(500).send("Server Error");
    }
  }
);

// Course fetching from database
router.post("/get", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;