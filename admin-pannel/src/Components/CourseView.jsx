import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import Header from "./Header";
import "./CourseView.css";
import { MessageContext } from "../Context/MessageContext";

const CourseView = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const { setMessage } = useContext(MessageContext);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const courseResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/course/get/${id}`
        );
        const reviewsResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/course/${id}/reviews`
        );
        setCourse(courseResponse.data);
        setReviews(reviewsResponse.data.reviews);
        setAverageRating(reviewsResponse.data.averageRating);
        setTotalReviews(reviewsResponse.data.totalReviews);
      } catch (error) {
        console.error("Error fetching course:", error);
        setError("Error fetching course details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);



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


  const handleEdit = () => {
    console.log("Edit Course");
  };

  const handleAddContent = (type) => {
    console.log(`Add new content: ${type}`);
  };

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const discountedPrice = course.course_price - course.course_discount;
  const discountPercentage = (
    (course.course_discount / course.course_price) *
    100
  ).toFixed(0);

  return (
    <>
      <Header />
      <div className="container my-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-4 order-1 order-lg-1 bg-white p-4 rounded shadow-sm sidebar">
            <div className="course-details">
              <img
                src={course.course_img}
                alt={course.course_name}
                className="img-fluid mb-3 rounded"
              />
              <h2>{course.course_name}</h2>
              <p>{course.course_desc}</p>
              <p>
                <strong>Duration:</strong> {course.course_duration}
              </p>
              <p>
                <strong>Instructor:</strong> {course.course_instructor || "N/A"}
              </p>
              <p>
                <strong>Category:</strong> {course.course_category || "N/A"}
              </p>
              <div className="price-section">
                <p>
                  <strong>Original Price:</strong> Rs. {course.course_price}
                </p>
                <p>
                  <strong>Discount:</strong> Rs. {course.course_discount}
                </p>
                <p>
                  <strong>Final Price:</strong> Rs. {discountedPrice} (
                  {discountPercentage}% OFF)
                </p>
                <p>
                  <strong>Rating:</strong> {renderStars(averageRating)} (
                  {averageRating.toFixed(1)})
                </p>
                <p>
                  <strong>Total Reviews:</strong> {totalReviews}
                </p>
              </div>
              <button
                className="btn btn-primary btn-block mt-3"
                onClick={handleEdit}
              >
                Edit Course
              </button>
            </div>
          </div>

          {/* Main Section */}
          <div className="col-lg-8 order-2 order-lg-2 bg-light p-4 rounded shadow-sm">
            <h2>Course Content</h2>
            <p>Manage course content like videos, modules, or documents.</p>
            <div className="add-content mb-4">
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => handleAddContent("New Folder")}
              >
                New Folder
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => handleAddContent("New File")}
              >
                New File
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="col-12 order-3 reviews-section">
            <h4>Course Reviews</h4>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.date} className="review">
                  <p>
                    <strong>
                      <i className="fas fa-user-alt"></i> {review.username}
                    </strong>{" "}
                    <span>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                    &nbsp;{review.rating}
                    <p></p>
                  </p>
                  <p>{review.review}</p>
                </div>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseView;
