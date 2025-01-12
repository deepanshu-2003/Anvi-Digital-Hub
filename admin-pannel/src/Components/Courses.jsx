import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import Header from "./Header";
import CreateCourse from "./CreateCourse";
import "bootstrap/dist/css/bootstrap.min.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false); // Modal visibility state

  // Handle modal open and close
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

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
          <h1 className="mb-2 text-center text-primary">Our Courses</h1>
          {/* Create Course Button */}
          <div className="d-flex justify-content-end mb-3">
            <Button
              className="btn btn-dark"
              onClick={handleModalOpen}
              style={{ fontWeight: "bold", fontSize: "20px" }}
            >
              Create
            </Button>
          </div>

          {/* Courses Grid */}
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
                      style={{ height: "200px", objectFit: "cover" }}
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
                          View Course
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

      {/* Modal for Create Course */}
      <Modal show={showModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Create a New Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateCourse onSuccess={handleModalClose}/>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Courses;
