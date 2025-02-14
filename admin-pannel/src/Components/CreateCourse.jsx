import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Message from "./Message";

const CreateCourse = ({onSuccess}) => {
  const [courseData, setCourseData] = useState({
    course_name: "",
    course_desc: "",
    course_price: "",
    course_discount: "",
    course_img: "",
    course_duration: "",
  });

  const [imageInputType, setImageInputType] = useState('url');
  const [authToken] = useState(localStorage.getItem("auth_token"));
  const [message, setMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
  };

  const handleImageChange = async (e) => {
    if (imageInputType === 'file' && e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCourseData({ ...courseData, course_img: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      handleInputChange(e);
    }
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
            as="textarea"
            rows={3}
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

        <Form.Group className="mb-3">
          <Form.Label>Image Input Method</Form.Label>
          <div>
          <Form.Check
            inline
            type="radio"
            label="URL"
            name="imageInputType"
            value="url"
            checked={imageInputType === 'url'}
            onChange={(e) => setImageInputType(e.target.value)}
          />
          <Form.Check
            inline
            type="radio"
            label="Upload File"
            name="imageInputType"
            value="file"
            checked={imageInputType === 'file'}
            onChange={(e) => setImageInputType(e.target.value)}
          />
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="courseImage">
          <Form.Label>Course Image {imageInputType === 'url' ? 'URL' : 'Upload'}</Form.Label>
          {imageInputType === 'url' ? (
          <Form.Control
            type="text"
            placeholder="Enter course image URL"
            name="course_img"
            value={courseData.course_img}
            onChange={handleInputChange}
            required
          />
          ) : (
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required={!courseData.course_img}
          />
          )}
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

        <Button variant="primary" type="submit" className="w-100">
          Create Course
        </Button>
      </Form>
    </div>
  );
};

export default CreateCourse;
