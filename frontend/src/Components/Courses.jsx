import React, { useEffect, useState } from "react";
import Header from "./Header";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);

  // Fetch courses from the backend using POST
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/course/get/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <>
      <Header />
      <div className="about-page bg-light py-5">
        <div className="container">
          <h1 className="mb-5 text-center text-primary">Our Courses</h1>
          <div className="row">
            {courses.map((course) => {
              const discountedPrice =
                course.course_price - course.course_discount;
              const discountPercentage = (
                (course.course_discount / course.course_price) *
                100
              ).toFixed(0); // Calculate and round off the percentage

              return (
                <div className="col-md-4 mb-4" key={course._id}>
                  <div
                    className="card h-100 border-0 shadow-sm"
                    style={{ borderRadius: "10px", overflow: "hidden" }}
                  >
                    <img
                      src={
                        course.course_img !== "Please enter a course image"
                          ? course.course_img
                          : "https://via.placeholder.com/300"
                      }
                      className="card-img-top"
                      alt={course.course_name}
                      style={{ height: "300px", objectFit: "cover" }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-dark">{course.course_name}</h5>
                      <p className="card-text text-muted">{course.course_desc}</p>
                      <p className="card-text text-muted">
                        Duration: <span className="fw-bold">{course.course_duration}</span>
                      </p>
                      <div className="mt-auto">
                        <p className="text-danger mb-0 fw-bold" style={{ fontSize: "16px" }}>
                          <s>Rs. {course.course_price}/-</s>
                        </p>
                        <p
                          className="text-success fw-bold"
                          style={{ fontSize: "20px" }}
                        >
                          Rs. {discountedPrice}/-{" "}
                          <span className="badge bg-success ms-4">
                            {discountPercentage}% OFF
                          </span>
                        </p>
                        <Button
                          variant="success"
                          className="w-100 mt-2"
                          style={{
                            fontWeight: "bold",
                            letterSpacing: "1px",
                          }}
                        >
                          Join Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Courses;
