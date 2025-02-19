import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaBook, FaFolder, FaLock, FaClock, FaUser, FaTag, FaStar, FaFileVideo, FaFilePdf, FaFolderOpen } from 'react-icons/fa';
import axios from "axios";
import { Spinner, Modal, Button } from "react-bootstrap";
import Header from "./Header";
import "./CourseView.css";
import { MessageContext } from "../Context/MessageContext";
import Verification from "./Verification";
import "bootstrap/dist/css/bootstrap.min.css";
import Hls from "hls.js";
import { Document, Page, pdfjs } from 'react-pdf';
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

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
  const [showFileModal, setShowFileModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [videoPlayer, setVideoPlayer] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const navigate = useNavigate();

  // Initialize PDF.js
  useEffect(() => {
    const initializePdfJs = async () => {
      try {
        await import('pdfjs-dist/build/pdf.worker.entry');
      } catch (error) {
        console.error('Error initializing PDF.js worker:', error);
      }
    };
    initializePdfJs();
  }, []);

  useEffect(() => {
    console.log("Fetching content for course ID:", id);
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
        console.log("Content fetched:", contentRes.data);
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

  useEffect(() => {
    return () => {
      if (videoPlayer) {
        videoPlayer.destroy();
      }
    };
  }, [videoPlayer]);

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

  // Update handleFilePlay function
  const handleFilePlay = async (file) => {
    console.log("Opening file:", file);
    try {
      // Clean up previous video instance if exists
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      setCurrentFile(file);
      setFileLoading(true);
      setFileError(null);
      setShowFileModal(true);
      
      if (file.file_type === 'pdf') {
        setPageNumber(1);
        setNumPages(null);
      }
    } catch (error) {
      console.error("Error accessing file:", error);
      setMessage({ type: "error", text: "Error accessing file. Please try again." });
      setFileLoading(false);
    }
  };

  // Separate useEffect for video cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Update video handling useEffect
  useEffect(() => {
    if (currentFile?.file_type === 'video' && showFileModal) {
      const initializeVideo = async () => {
        try {
          const videoElement = videoRef.current;
          if (!videoElement) {
            console.error("Video element not found");
            return;
          }

          if (Hls.isSupported()) {
            console.log("HLS is supported");
            const token = localStorage.getItem("auth_token") || null;
            const hls = new Hls({
              xhrSetup: function (xhr) {
                xhr.setRequestHeader("auth_token", token);
              },
              enableWorker: true,
              debug: true,
            });
            hlsRef.current = hls;

            const videoUrl = `${import.meta.env.VITE_BACKEND_URL}/course/stream/${currentFile._id}`;
            console.log("Loading video URL:", videoUrl);

            hls.loadSource(videoUrl);
            hls.attachMedia(videoElement);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log("HLS Manifest parsed successfully");
              videoElement.play()
                .then(() => {
                  console.log("Video playback started");
                  setFileLoading(false);
                })
                .catch((error) => {
                  console.error("Error playing video:", error);
                  setFileError("Error starting video playback");
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error("HLS error event:", event);
              console.error("HLS error data:", data);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("Fatal network error encountered, trying to recover");
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("Fatal media error encountered, trying to recover");
                    hls.recoverMediaError();
                    break;
                  default:
                    console.error("Fatal error, cannot recover");
                    setFileError("An error occurred while playing the video. Please try again.");
                    hls.destroy();
                    break;
                }
              }
            });
          } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
            console.log("Using native HLS playback");
            const token = localStorage.getItem("auth_token");
            videoElement.src = `${import.meta.env.VITE_BACKEND_URL}/course/stream/${currentFile._id}?token=${token}`;
            
            videoElement.addEventListener("loadedmetadata", () => {
              console.log("Video metadata loaded");
              setFileLoading(false);
              videoElement.play().catch((error) => {
                console.error("Error playing video:", error);
                setFileError("Error playing video");
              });
            });
          } else {
            console.error("HLS is not supported");
            setFileError("Your browser does not support HLS video playback.");
            setFileLoading(false);
          }
        } catch (error) {
          console.error("Error initializing video:", error);
          setFileError("Error initializing video player. Please try again.");
          setFileLoading(false);
        }
      };

      initializeVideo();
    }
  }, [currentFile, showFileModal]);

  // Fetch course and reviews
  useEffect(() => {
    console.log("Fetching course and reviews for ID:", id);
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

        console.log("Course data:", courseData);
        console.log("Reviews data:", reviewsData);

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
          console.log("Member status:", memberData.status);
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

  // PDF functions
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setFileLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  // Update the PDF rendering part
  const renderPdfViewer = () => {
    if (!currentFile) return null;

    return (
      <div className="pdf-container">
        {fileLoading && (
          <div className="loading-overlay">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading PDF...</p>
          </div>
        )}
        <Document
          file={{
            url: `${import.meta.env.VITE_BACKEND_URL}/course/pdf/${currentFile._id}`,
            httpHeaders: {
              'auth_token': localStorage.getItem("auth_token"),
            },
            withCredentials: false
          }}
          onLoadSuccess={({ numPages: nextNumPages }) => {
            console.log('PDF loaded successfully, pages:', nextNumPages);
            setNumPages(nextNumPages);
            setFileLoading(false);
          }}
          onLoadError={(error) => {
            console.error("Error loading PDF:", error);
            setFileError("Error loading PDF. Please check your internet connection and try again.");
            setFileLoading(false);
          }}
          loading={
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading PDF...</span>
              </Spinner>
            </div>
          }
          error={
            <div className="text-center text-danger p-5">
              <p>Error loading PDF. Please try again.</p>
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  setFileError(null);
                  setFileLoading(true);
                  handleFilePlay(currentFile);
                }}
              >
                Retry
              </Button>
            </div>
          }
          options={{
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
            disableAutoFetch: false,
            disableStream: false,
            enableXfa: true,
            useSystemFonts: true,
            isEvalSupported: false,
            useWorkerFetch: true
          }}
        >
          {numPages > 0 && (
            <>
              <Page
                key={`page_${pageNumber}`}
                pageNumber={pageNumber}
                width={Math.min(window.innerWidth * 0.8, 800)}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={() => {
                  console.log('Page loaded successfully');
                  setFileLoading(false);
                }}
                onRenderError={(error) => {
                  console.error("Error rendering page:", error);
                  setFileError("Error rendering PDF page. Please try again.");
                  setFileLoading(false);
                }}
                loading={
                  <div className="text-center p-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                }
                error={
                  <div className="text-center text-danger">
                    <p>Failed to render page. Retrying...</p>
                  </div>
                }
              />
              <div className="text-center mt-3 pdf-controls">
                <Button 
                  onClick={previousPage} 
                  disabled={pageNumber <= 1}
                  variant="outline-primary"
                  className="me-2"
                >
                  Previous
                </Button>
                <span className="mx-3">
                  Page {pageNumber} of {numPages}
                </span>
                <Button 
                  onClick={nextPage} 
                  disabled={pageNumber >= numPages}
                  variant="outline-primary"
                  className="ms-2"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </Document>
      </div>
    );
  };

  // Add this to handle file downloads if needed
  const downloadFile = async (file) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/course/get-file/${file._id}`,
        {
          headers: {
            'auth_token': localStorage.getItem("auth_token")
          },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      setMessage({ type: "error", text: "Error downloading file. Please try again." });
    }
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

          <Modal
            show={showFileModal}
            onHide={() => {
              if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
              }
              setShowFileModal(false);
              setCurrentFile(null);
              setFileLoading(false);
              setFileError(null);
              setNumPages(null);
              setPageNumber(1);
            }}
            size="lg"
            centered
            className="file-viewer-modal"
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>{currentFile?.fileName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {currentFile?.file_type === 'pdf' && renderPdfViewer()}
              {currentFile?.file_type === 'video' && (
                <div className="video-container">
                  {fileLoading && (
                    <div className="loading-overlay">
                      <Spinner animation="border" variant="light" />
                      <p className="mt-2 text-light">Loading video...</p>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    style={{ width: "100%", height: "auto", maxHeight: "80vh" }}
                    onLoadStart={() => setFileLoading(true)}
                    onError={(e) => {
                      console.error("Video error:", e.target.error);
                      setFileError("Error playing video. Please try again.");
                      setFileLoading(false);
                    }}
                  />
                  {fileError && (
                    <div className="alert alert-danger m-3">
                      {fileError}
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-3"
                        onClick={() => {
                          setFileError(null);
                          setFileLoading(true);
                          handleFilePlay(currentFile);
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {fileError && !currentFile?.file_type && (
                <div className="text-center text-danger p-5">
                  <p>{fileError}</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setFileError(null);
                      setFileLoading(true);
                      handleFilePlay(currentFile);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
};


export default CourseView;
