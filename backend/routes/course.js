const express = require("express");
const router = express.Router();
const Course = require("../models/courses");
const User = require("../models/users");
const CourseReview = require("../models/courseReview");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// @route - POST /course/add-course
// @desc - Add a new course
// @access - Public

const getUserId = (auth_token)=>{

}

// Course creation in database
const JWT_SECRET = process.env.JWT_SECRET;
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
    if (!token) {
      return res.status(401).json({ error: "Unauthorized Accesss" });
    } else {
      //verifying token from admin only
      try {
        console.log(token);
        const user_id = jwt.verify(token, JWT_SECRET);
        const usertype = await User.findById(user_id.id).select("type");
        if (usertype.type !== "admin")
          return res.status(401).json({ error: "Unauthorized Accesss" });
      } catch (error) {
        return res.status(401).json({ error: "Unauthorized Accesss" });
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
    const courses = await Course.aggregate([
      {
        $lookup: {
          from: "coursereviews", // Collection name of reviews
          localField: "_id",
          foreignField: "course",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
          totalReviews: { $size: "$reviews" },
        },
      },
    ]);

    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).send("Server Error");
  }
});



// Customer ratings on course
router.post(
  "/rating",
  [
    check("course_id", "Course ID is required").not().isEmpty(),
    check("user_id", "User ID is required").not().isEmpty(),
    check("rating", "Rating is required").isFloat({ min: 1, max: 5 }),
    check("review", "Review is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { course_id, user_id, rating, review } = req.body;
    try {
      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const newReview = new CourseReview({
        user: user_id,
        course: course_id,
        rating,
        review,
      });
      const savedReview = await newReview.save();
      res.json(savedReview);
    } catch (error) {
      console.error("Error submitting review:", error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);
module.exports = router;
