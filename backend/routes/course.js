const express = require("express");
const router = express.Router();
const Course = require("../models/courses");
const User = require("../models/users");
const CourseReview = require("../models/courseReview");
const { check, validationResult, body, query } = require("express-validator");
const courseContent = require("../models/courseContent");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const courseMember = require("../models/courseMember");

// @route - POST /course/add-course
// @desc - Add a new course
// @access - Public


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

router.get("/get/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error.message);
    res.status(500).send("Server Error");
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const courseId = req.params.id;

    // Validate course existence
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Aggregation pipeline to fetch reviews with username and calculate average rating
    const reviewsData = await CourseReview.aggregate([
      {
        $match: { course: new mongoose.Types.ObjectId(courseId) }, // Use 'new' for ObjectId
      },
      {
        $lookup: {
          from: "users", // Join with users collection
          localField: "user", // Field in CourseReview
          foreignField: "_id", // Field in User
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // Flatten the userDetails array
      },
      {
        $group: {
          _id: "$course", // Group by course
          reviews: {
            $push: {
              username: "$userDetails.username", // Fetch username from userDetails
              rating: "$rating",
              review: "$review",
              date: "$review_date",
            },
          },
          averageRating: { $avg: "$rating" }, // Calculate average rating
          totalReviews: { $sum: 1 }, // Count total reviews
        },
      },
      {
        $lookup: {
          from: "courses", // Join with courses collection
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: "$courseDetails", // Flatten the courseDetails array
      },
      {
        $project: {
          _id: 0,
          course: "$courseDetails.course_name", // Include course name
          averageRating: 1,
          totalReviews: 1,
          reviews: 1,
        },
      },
    ]);

    if (!reviewsData.length) {
      return res.json({
        course: courseExists.course_name,
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
      });
    }

    res.json(reviewsData[0]);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).send("Server Error");
  }
});

//  Get all courses
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

// -----------------Admin endpoints --------------------------
//--------------------Create Directory-----------------------------
const fs = require("fs");
const path = require("path");

router.post(
  "/make-dir",
  [
    check("name", "Please enter a valid directory name")
      .not()
      .isEmpty()
      .matches(/^[a-zA-Z0-9_\s]+$/), // Only alphanumeric characters, underscores, and spaces are allowed
    check("parent", "Parent ID must be a valid MongoDB ObjectId").optional().isMongoId(),
    check("course_id", "Course ID is required and must be a valid MongoDB ObjectId").isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Extract fields from the request
      const { name, parent, course_id } = req.body;
      const token = req.header("auth_token");

      // Check token validity
      if (!token) {
        return res.status(401).json({ error: "Unauthorized access" });
      }

      const user_id = jwt.verify(token, JWT_SECRET).id;

      // Verify user as admin
      const user = await User.findById(user_id).select("-password");
      if (!user || user.type !== "admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      // Verify course existence
      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if the parent directory exists (if provided)
      let parentDir = null;
      if (parent) {
        parentDir = await courseContent.findById(parent);
        if (!parentDir || parentDir.file_type !== "dir") {
          return res.status(400).json({ error: "Invalid parent directory" });
        }
      }

      // Check if a directory with the same name already exists under the same parent
      const existingDir = await courseContent.findOne({
        parent: parent || null,
        course: course_id,
        file_type: "dir",
        file: name,
      });

      if (existingDir) {
        return res.status(400).json({ error: "Directory with this name already exists" });
      }

      // Create the directory in the database
      const newDir = new courseContent({
        user: user_id,
        course: course_id,
        file_type: "dir",
        parent: parent || null,
        file: name,
      });

      const savedDir = await newDir.save();

      res.status(201).json({
        message: "Directory created successfully",
        directory: savedDir,
      });
    } catch (error) {
      console.error("Error creating directory:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);



// ------------------ check for CourseMember ---------------------
router.post("/check-member", async (req, res) => {
  let status = false;
  const token = req.header("auth_token");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized Accesss" });
  }
  try {
    const user_id = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(user_id.id);
    if (!user) return res.json({status: false});
    const {course_id} = req.body;
    const course = await Course.findById(course_id);
    
    if (!course) return res.json({ status:status });
    const member = await courseMember.findOne({ user: user_id.id, course: course_id });
    if (member && member.status === "active") {
      status = true;
    }
    return res.json({status: status});
  } catch (error) {
    console.error("Error checking member:", error);
    return res.json({status: false});
  }
}
);




module.exports = router;
