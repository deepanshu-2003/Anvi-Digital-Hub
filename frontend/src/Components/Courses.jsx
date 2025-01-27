import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Courses.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/course/get/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );

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

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <>
        {[...Array(fullStars)].map((_, index) => (
          <i key={index} className="fas fa-star text-warning"></i>
        ))}
        {halfStar && <i className="fas fa-star-half-alt text-warning"></i>}
        {[...Array(emptyStars)].map((_, index) => (
          <i key={index} className="far fa-star text-warning"></i>
        ))}
      </>
    );
  };

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
              ).toFixed(0);

              return (
                <div
                  className="col-lg-3 col-md-4 col-sm-6 col-12 mb-4"
                  key={course._id}
                  style={{ cursor: "pointer" }}
                >
                  <Link
                    to={`/course/${course._id}`}
                    className="text-decoration-none"
                  >
                    <div className="card course-card h-100 border-0 shadow-sm">
                      <img
                        src={
                          course.course_img !== "Please enter a course image"
                            ? course.course_img
                            : "https://via.placeholder.com/300"
                        }
                        className="card-img-top"
                        alt={course.course_name}
                        style={{ height: "150px", objectFit: "cover" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title text-dark">
                          {course.course_name}
                        </h5>
                        <p className="card-text text-muted course-desc">
                          {course.course_desc}
                        </p>
                        <p className="card-text text-muted">
                          Duration:{" "}
                          <span className="fw-bold">
                            {course.course_duration}
                          </span>
                        </p>
                        <div className="mb-2">
                          {renderStars(course.averageRating)}
                        </div>
                        <p className="card-text text-muted">
                          Rating:{" "}
                          <span className="fw-bold">
                            {course.averageRating
                              ? course.averageRating.toFixed(1)
                              : "No ratings yet"}{" "}
                            ({course.totalReviews}{" "}
                            {course.totalReviews === 1 ? "review" : "reviews"})
                          </span>
                        </p>
                        <div className="mt-auto">
                          <p
                            className="text-danger mb-0 fw-bold"
                            style={{ fontSize: "14px" }}
                          >
                            <s>Rs. {course.course_price}/-</s>
                          </p>
                          <p
                            className="text-success fw-bold"
                            style={{ fontSize: "18px" }}
                          >
                            Rs. {discountedPrice}/-{" "}
                            <span className="badge bg-success ms-4">
                              {discountPercentage}% OFF
                            </span>
                          </p>
                          <p className="text-muted mb-0">
                            {course.course_label ? (
                              <span className="badge bg-primary">
                                {course.course_label}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
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
