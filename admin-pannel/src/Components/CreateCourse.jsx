import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Message from "./Message"; // Import the Message component

const CreateCourse = ({onSuccess}) => {
  const [courseData, setCourseData] = useState({
    course_name: "",
    course_desc: "",
    course_price: "",
    course_discount: "",
    course_img: "",
    course_duration: "",
  });

  const [authToken] = useState(localStorage.getItem("auth_token")); // Replace with actual token
  const [message, setMessage] = useState(null); // Message state

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null); // Reset the message

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/course/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth_token: `${authToken}`,
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: "Course created successfully!" });
        onSuccess();
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to create course.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error creating course. Please try again.",
      });
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center text-primary mb-4">Create a New Course</h1>

      {/* Display the Message component */}
      {message && (
        <Message
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)} // Clear the message when closed
        />
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="courseName">
          <Form.Label>Course Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course name"
            name="course_name"
            value={courseData.course_name}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="courseDesc">
          <Form.Label>Course Description</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course description"
            name="course_desc"
            value={courseData.course_desc}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="coursePrice">
          <Form.Label>Course Price</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter course price"
            name="course_price"
            value={courseData.course_price}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="courseDiscount">
          <Form.Label>Course Discount</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter course discount"
            name="course_discount"
            value={courseData.course_discount}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="courseImage">
          <Form.Label>Course Image URL</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course image URL"
            name="course_img"
            value={courseData.course_img}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="courseDuration">
          <Form.Label>Course Duration</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course duration"
            name="course_duration"
            value={courseData.course_duration}
            onChange={handleInputChange}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Create Course
        </Button>
      </Form>
    </div>
  );
};

export default CreateCourse;
