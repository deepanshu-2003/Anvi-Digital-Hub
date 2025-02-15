import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaBook, FaFolder, FaLock, FaClock, FaUser, FaTag, FaStar, FaFileVideo, FaFilePdf, FaFolderOpen } from 'react-icons/fa';
import axios from "axios";
import { Spinner } from "react-bootstrap";
import Header from "./Header";
import "./CourseView.css";
import { MessageContext } from "../Context/MessageContext";
import Verification from "./Verification";
import "bootstrap/dist/css/bootstrap.min.css";


const CourseView = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const messageContext = useContext(MessageContext);
  const { message, setMessage } = messageContext || { message: null, setMessage: () => {} };
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [proceedPayment, setProceedPayment] = useState(false);
  const [member, setMember] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentDir, setContentDir] = useState([]);
  const [contentFiles, setContentFiles] = useState([]);
  const [pwd, setPwd] = useState([]);
  const [parent, setParent] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      setLoadingContent(true);
      try {
        const contentRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/course/show-content`,
          {
            course_id: id,
            ...(parent && { parent: parent }),
          },
          {
            headers: {
                auth_token: localStorage.getItem("auth_token") || null,
            },
          }
        );
        setContentDir(contentRes.data.directories);
        setContentFiles(contentRes.data.files);
      } catch (error) {
        console.error("Error fetching content:", error);
        setMessage({ type: "error", text: "Error loading course content." });
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, [id, parent]);


  // Add navigation handlers
  const handleNavigate = (newParent) => {
    setParent(newParent._id);
    setPwd([...pwd, newParent]);
  };

  const handleBack = () => {
    if (pwd.length > 0) {
      const newPwd = [...pwd];
      newPwd.pop();
      setPwd(newPwd);
      setParent(newPwd.length > 0 ? newPwd[newPwd.length - 1]._id : null);
    }
  };

  // Add file handling
  const handleFilePlay = async (file) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/course/get-file/${file._id}`,
        {
          headers: {
            auth_token: localStorage.getItem("auth_token") || null,
          },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      if (file.file_type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.style.width = '100%';
        video.style.maxHeight = '80vh';
        
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
        
        modal.appendChild(video);
        document.body.appendChild(modal);
        
        modal.onclick = () => {
          document.body.removeChild(modal);
          window.URL.revokeObjectURL(url);
        };
      } else {
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error playing/downloading file:", error);
      setMessage({ type: "error", text: "Error accessing file." });
    }
  };

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
            auth_token: localStorage.getItem("auth_token") || null,
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
    return [...Array(5)].map((_, index) => (
      <FaStar key={index} className={index < rating ? "text-warning" : "text-muted"} />
    ));
  };


  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/rating`,
        {
          course_id: id,
          user_id: localStorage.getItem("auth_token") || null,
          rating: reviewForm.rating,
          review: reviewForm.review
        },
        {
          headers: {
            "Content-Type": "application/json",
            auth_token: localStorage.getItem("auth_token") || null,
          },
        }
      );
      setMessage({ type: "success", text: "Review submitted successfully" });
      // Refresh reviews
      const reviewsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/course/${id}/reviews`
      );
      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData.reviews);
      setAverageRating(reviewsData.averageRating);
      setTotalReviews(reviewsData.totalReviews);
      // Reset form
      setReviewForm({ rating: 5, review: '' });
    } catch (error) {
      setMessage({ type: "error", text: "Error submitting review" });
    }
  };

  const discountedPrice = course.course_price - course.course_discount;
  const discountPercentage = (
    (course.course_discount / course.course_price) *
    100
  ).toFixed(0);

  return (
    <div className="course-container">
      <Header />
      {!course ? (
        <div className="alert alert-danger">Course not found</div>
      ) : (
        <>
          <Link to="/courses" className="back-button">
            <FaArrowLeft /> Back to Courses
          </Link>

          <div className="course-header">
            <div className="course-image">
              <img src={course.course_img} alt={course.course_name} />
            </div>
            <div className="course-info">
              <h1 className="course-title">{course.course_name}</h1>
              <p>{course.course_desc}</p>
              
              <div className="course-meta">
                <div className="meta-item">
                  <FaClock />
                  <span>Duration: {course.course_duration}</span>
                </div>
                <div className="meta-item">
                  <FaUser />
                  <span>Instructor: {course.course_instructor || "N/A"}</span>
                </div>
                <div className="meta-item">
                  <FaTag />
                  <span>Category: {course.course_category || "N/A"}</span>
                </div>
                <div className="meta-item">
                  <span>{renderStars(averageRating)} ({averageRating.toFixed(1)})</span>
                </div>
                <div className="meta-item">
                  <span>Reviews: {totalReviews}</span>
                </div>
              </div>
            </div>
          </div>

            <div className="course-content">
            <h2 className="content-title">Course Content</h2>
            {loadingContent ? (
              <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading content...</span>
              </Spinner>
              </div>
            ) : (
              <>
              {parent && (
                <button className="back-button mb-3" onClick={handleBack}>
                <FaArrowLeft /> Back
                </button>
              )}
              <div className="content-navigation">
                {pwd.length > 0 && (
                <div className="breadcrumb">
                  <span 
                  className="breadcrumb-item" 
                  onClick={() => {
                    setParent(null);
                    setPwd([]);
                  }}
                  >
                  Root
                  </span>
                  {pwd.map((directory, index) => (
                  <React.Fragment key={directory._id}>
                    <span className="breadcrumb-separator">/</span>
                    <span
                    className="breadcrumb-item"
                    onClick={() => {
                      setParent(directory._id);
                      setPwd(pwd.slice(0, index + 1));
                    }}
                    >
                    {directory.fileName}
                    </span>
                  </React.Fragment>
                  ))}
                </div>
                )}
              </div>
              
              <div className="content-container">
                {contentDir.map((directory) => (
                <div 
                  key={directory._id} 
                  className="content-item" 
                  data-private={directory.visibility === 'private'}
                  onClick={() => directory.visibility === 'private' && !member ? 
                  setMessage({ type: "warning", text: "This content is private. Please purchase the course to access." }) : 
                  handleNavigate(directory)}
                >
                  <div className="content-icon">
                  <FaFolder />
                  {directory.visibility === 'private' && <FaLock className="lock-icon" />}
                  </div>
                  <span>{directory.fileName}</span>
                </div>
                ))}
                
                {contentFiles.map((file) => (
                <div 
                  key={file._id} 
                  className="content-item"
                  data-private={file.visibility === 'private'}
                  onClick={() => file.visibility === 'private' && !member ? 
                  setMessage({ type: "warning", text: "This content is private. Please purchase the course to access." }) : 
                  handleFilePlay(file)}
                >
                  <div className="content-icon">
                  {file.file_type === 'video' ? <FaFileVideo /> : <FaFilePdf />}
                  {file.visibility === 'private' && <FaLock className="lock-icon" />}
                  </div>
                  <span>{file.fileName}</span>
                </div>
                ))}
                
                {!contentDir.length && !contentFiles.length && (
                <div className="empty-content">
                  <span className="content-icon">
                  <FaFolderOpen />
                  </span>
                  <p>No content available in this folder</p>
                </div>
                )}
              </div>
              </>
            )}
            </div>


            <div className="reviews-section">
            <h4>Course Reviews</h4>
            {member && (
              <form onSubmit={handleReviewSubmit} className="review-form mb-4">
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <div className="rating-slider-container">
                  <input 
                    type="range" 
                    className="rating-slider" 
                    min="1" 
                    max="5" 
                    step="1" 
                    value={reviewForm.rating}
                    style={{ '--rating-percent': reviewForm.rating / 5 }}
                    onChange={(e) => setReviewForm({...reviewForm, rating: parseFloat(e.target.value)})}
                  />
                    <div className="rating-labels">
                    <span className={`rating-label ${reviewForm.rating === 1 ? 'active' : ''}`}>
                      <span className="emoji">😞</span>
                      <span className="rating-number">1</span>
                      <span className="label">Terrible</span>
                    </span>
                    <span className={`rating-label ${reviewForm.rating === 2 ? 'active' : ''}`}>
                      <span className="emoji">😕</span>
                      <span className="rating-number">2</span>
                      <span className="label">Poor</span>
                    </span>
                    <span className={`rating-label ${reviewForm.rating === 3 ? 'active' : ''}`}>
                      <span className="emoji">😊</span>
                      <span className="rating-number">3</span>
                      <span className="label">Average</span>
                    </span>
                    <span className={`rating-label ${reviewForm.rating === 4 ? 'active' : ''}`}>
                      <span className="emoji">😃</span>
                      <span className="rating-number">4</span>
                      <span className="label">Good</span>
                    </span>
                    <span className={`rating-label ${reviewForm.rating === 5 ? 'active' : ''}`}>
                      <span className="emoji">🤩</span>
                      <span className="rating-number">5</span>
                      <span className="label">Excellent</span>
                    </span>
                    </div>
                  </div>

              </div>
              <div className="mb-3">
                <label className="form-label">Review</label>
                <textarea
                className="form-control"
                value={reviewForm.review}
                onChange={(e) => setReviewForm({...reviewForm, review: e.target.value})}
                required
                rows="3"
                placeholder="Write your review here..."
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Submit Review
              </button>
              </form>
            )}
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.date} className="review">
                  <div className="review-header">
                    <strong><FaUser /> {review.username}</strong>
                    <span>{renderStars(review.rating)} {review.rating}</span>
                  </div>
                  <p>{review.review}</p>
                </div>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>

          <div className="fixed-bottom-bar">
            {!member ? (
              <>
                <div className="price-info">
                  <strong>Price: </strong>
                  <span className="original-price">₹{course.course_price}</span>
                  <span className="discounted-price">₹{discountedPrice}</span>
                  <span className="discount-tag">{discountPercentage}% OFF</span>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleBuyNow}>
                  BUY NOW
                </button>
              </>
            ) : (
              <Link to="/dashboard" className="dashboard-button">
                Go to Dashboard
              </Link>
            )}
          </div>

          {showMetaModal && (
            <Verification
              show={showMetaModal}
              onHide={() => setShowMetaModal(false)}
              onSuccess={() => {
                setShowMetaModal(false);
                setProceedPayment(true);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};


export default CourseView;
