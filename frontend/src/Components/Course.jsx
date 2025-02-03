import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import Header from "./Header";
import "./Course.css";
import { MessageContext } from "../Context/MessageContext";
import Verification from "./Verification";

const Course = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const { message, setMessage } = useContext(MessageContext);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [proceedPayment, setProceedPayment] = useState(false);
  const [member, setMember] = useState(false);

  const navigate = useNavigate();

  // Fetch course and reviews
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const courseResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/course/get/${id}`
        );
        const reviewsResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/course/${id}/reviews`
        );

        if (!courseResponse.ok || !reviewsResponse.ok) {
          throw new Error(`HTTP error! status: ${courseResponse.status}`);
        }

        const courseData = await courseResponse.json();
        const reviewsData = await reviewsResponse.json();

        const memberResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/course/check-member`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              auth_token: localStorage.getItem("auth_token"),
            },
            body: JSON.stringify({ course_id: id }),
          }
        );
        if (memberResponse.ok) {
          const memberData = await memberResponse.json();
          setMember(memberData.status);
          console.log("Member:", memberData.status);
        }

        setCourse(courseData);
        setReviews(reviewsData.reviews);
        setAverageRating(reviewsData.averageRating);
        setTotalReviews(reviewsData.totalReviews);
      } catch (error) {
        console.error("Error fetching course:", error);
        setError("Error fetching course details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Handle payment initiation
  const initiatePayment = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/payment/initiate`,
        {
          course_id: id,
        },
        {
          headers: {
            auth_token: localStorage.getItem("auth_token"),
          },
        }
      );

      if (response.status === 200) {
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "Anvi Digital Hub",
          description: "Purchase Course",
          image: "/logo192.png",
          order_id: response.data.id,
          handler: async function (resp) {
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/payment/response`,
              {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                course_id: id,
                status: "success",
              }
            );
            setMessage({
              type: "success",
              text: "Course Purchased Successfully.",
            });
          },
          theme: {
            color: "#2f0fe6",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setMessage({ type: "error", text: "Error initiating payment" });
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setMessage({ type: "error", text: "Error initiating payment" });
    }
  };

  // Handle Buy Now button click
  const handleBuyNow = () => {
    if (!localStorage.getItem("auth_token")) {
      setMessage({ type: "warning", text: "Please Login with a user ID" });
      return;
    }

    // Show verification modal if payment hasn't been approved yet
    if (!proceedPayment) {
      setShowMetaModal(true);
      return;
    }

    // If payment is approved, initiate payment
    initiatePayment();
  };

  // Trigger payment after verification
  useEffect(() => {
    if (proceedPayment) {
      initiatePayment();
      setProceedPayment(false); // Reset the state after payment is initiated
    }
  }, [proceedPayment]);

  // Render stars (existing code)
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
          {/* Sidebar (Course Info) */}
          <div
            className="col-lg-4 order-1 order-lg-1 bg-white p-4 rounded shadow-sm"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="course-details">
              <img
                src={course.course_img}
                alt={course.course_name}
                className="img-fluid mb-3 rounded"
                style={{ maxWidth: "150px" }}
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
              <p>
                <strong>Rating:</strong> {renderStars(averageRating)} (
                {averageRating.toFixed(1)})
              </p>
              <p>
                <strong>Total Reviews:</strong> {totalReviews}
              </p>
            </div>
          </div>

          {/* Main Section */}
          <div className="col-lg-8 order-2 order-lg-2 bg-light p-4 rounded shadow-sm">
            <h2>Main Section</h2>
            <p>
              This is where you can add other course content like videos,
              modules, or descriptions.
            </p>
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

      {/* Fixed Bottom Bar */}
      <div className="fixed-bottom-bar">
        {!member ? (
          <>
            <div>
              <strong>Price: </strong>
              <span>
                <s>Rs. {course.course_price}</s>{" "}
                <strong style={{ color: "green" }}>
                  Rs. {discountedPrice}
                </strong>
              </span>
              <span style={{ marginLeft: "10px", color: "red" }}>
                ({discountPercentage}% OFF)
              </span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleBuyNow}>
              BUY NOW
            </button>
          </>
        ) : (
          <div className="dashboard-container">
            <span className="dashboard-message">
              Go to Dashboard to access course content. You can visit through
              navigating on profile tab or clicking here.
            </span>
            <button className="btn btn-success btn-lg" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showMetaModal && (
        <Verification
          show={showMetaModal}
          onHide={() => setShowMetaModal(false)}
          onSuccess={() => {
            setShowMetaModal(false); // Close the modal
            setProceedPayment(true); // Set proceedPayment to true
          }}
        />
      )}
    </>
  );
};

export default Course;
