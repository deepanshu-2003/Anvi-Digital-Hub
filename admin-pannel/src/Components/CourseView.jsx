import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import axios from "axios";
import Hls from "hls.js";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import Spinner from "react-bootstrap/Spinner";
import Header from "./Header";
import "./CourseView.css";
import { MessageContext } from "../Context/MessageContext";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const CourseView = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const { setMessage } = useContext(MessageContext);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileStatuses, setFileStatuses] = useState({});
  const [uploading, setUploading] = useState(false);
  const [parent, setParent] = useState(null);
  const [contentDir, setContentDir] = useState([]);
  const [contentFiles, setContentFiles] = useState([]);
  const [pwd, setPwd] = useState([]);
  // State for Create Folder Modal
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderVisibility, setFolderVisibility] = useState("public");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [userType, setUserType] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

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

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/auth/user-type`,
          {
            headers: { auth_token: token },
          }
        );
        setUserType(response.data.type);
      } catch (error) {
        console.error("Error fetching user type:", error);
      }
    };
    fetchUserType();
  }, []);

  useEffect(() => {
    if (currentFile?.file_type === "video") {
      const videoElement = document.getElementById("videoPlayer");
      if (Hls.isSupported() && videoElement) {
        const token = localStorage.getItem("auth_token") || null;
        const hls = new Hls({
          xhrSetup: function (xhr) {
            xhr.setRequestHeader("auth_token", token);
          },
          enableWorker: true,
          debug: true,
        });

        const videoUrl = `${import.meta.env.VITE_BACKEND_URL}/course/stream/${
          currentFile._id
        }`;

        hls.loadSource(videoUrl);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setFileLoading(false);
          videoElement.play().catch((error) => {
            console.error("Error auto-playing:", error);
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad(); // Try to recover from network error
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError(); // Try to recover from media error
                break;
              default:
                setFileError(
                  "An error occurred while playing the video. Please try again."
                );
                hls.destroy();
                break;
            }
          }
        });

        return () => {
          hls.destroy();
        };
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        const token = localStorage.getItem("auth_token");
        videoElement.src = `${import.meta.env.VITE_BACKEND_URL}/course/stream/${
          currentFile._id
        }?token=${token}`;
        videoElement.addEventListener("loadedmetadata", () => {
          setFileLoading(false);
          videoElement.play().catch(console.error);
        });
      } else {
        setFileError("Your browser does not support HLS video playback.");
      }
    }
  }, [currentFile]);

  const getStatusColor = (status) => {
    switch (status) {
      case "uploading":
        return "text-primary";
      case "processing":
        return "text-warning";
      case "completed":
        return "text-success";
      case "error":
        return "text-danger";
      default:
        return "text-secondary";
    }
  };

  const navigate = useNavigate();

  // Fetch course details and reviews (runs once on component mount)
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoadingCourse(true);
      try {
        const [courseRes, reviewsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/course/get/${id}`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/course/${id}/reviews`),
        ]);
        setCourse(courseRes.data);
        setReviews(reviewsRes.data.reviews);
        setAverageRating(reviewsRes.data.averageRating);
        setTotalReviews(reviewsRes.data.totalReviews);
      } catch (error) {
        console.error("Error fetching course:", error);
        setError("Error fetching course details.");
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  // Fetch course content (updates when parent changes)
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
        setMessage("Error loading course content.");
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, [id, parent]);

  // Add useEffect for handling video processing status
  useEffect(() => {
    // Update file statuses when processing videos
    const processingFiles = Object.entries(fileStatuses).filter(
      ([_, status]) => status === "processing"
    );
    if (processingFiles.length > 0) {
      const interval = setInterval(async () => {
        try {
          const contentRes = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/course/show-content`,
            {
              course_id: id,
              ...(parent && { parent: parent }),
            }
          );

          // Check if processing files are now available
          const newFiles = contentRes.data.files;
          processingFiles.forEach(([fileName]) => {
            const fileFound = newFiles.find((f) => f.fileName === fileName);
            if (fileFound) {
              setFileStatuses((prev) => ({
                ...prev,
                [fileName]: "completed",
              }));
            }
          });

          // If all files are processed, clear interval
          if (newFiles.length >= processingFiles.length) {
            clearInterval(interval);
            setContentDir(contentRes.data.directories);
            setContentFiles(contentRes.data.files);
          }
        } catch (error) {
          console.error("Error checking processing status:", error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [fileStatuses, id, parent]);

  // Render stars for rating
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

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const isValid =
        file.type === "video/mp4" || file.type === "application/pdf";
      if (!isValid) {
        setMessage({
          type: "error",
          text: `${file.name} is not a valid file type. Only MP4 and PDF files are allowed.`,
        });
      }
      return isValid;
    });

    // Set initial status for each file
    const initialStatuses = {};
    validFiles.forEach((file) => {
      initialStatuses[file.name] = "pending";
    });
    setFileStatuses(initialStatuses);
    setSelectedFiles(validFiles);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage({ type: "error", text: "Please select files to upload." });
      return;
    }

    setUploading(true);
    const formData = new FormData();

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("course_id", id);
    if (parent) formData.append("parent", parent);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/upload-file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            auth_token: localStorage.getItem("auth_token") || null,
          },

          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            const newProgress = {};
            selectedFiles.forEach((file) => {
              newProgress[file.name] = progress;
            });
            setUploadProgress(newProgress);
          },
        }
      );

      // Update file statuses based on response
      const newFileStatuses = {};
      response.data.files.forEach((file) => {
        newFileStatuses[file.originalName] = file.status;
      });
      setFileStatuses(newFileStatuses);

      // Refresh content after upload
      const contentRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/show-content`,
        {
          course_id: id,
          ...(parent && { parent: parent }),
        }
      );
      setContentDir(contentRes.data.directories);
      setContentFiles(contentRes.data.files);

      setMessage({ type: "success", text: "Files uploaded successfully" });
    } catch (error) {
      console.error("Error uploading files:", error);
      setMessage({ type: "error", text: "Failed to upload files" });
      const newFileStatuses = {};
      selectedFiles.forEach((file) => {
        newFileStatuses[file.name] = "error";
      });
      setFileStatuses(newFileStatuses);
    } finally {
      setUploading(false);
      setSelectedFiles([]);
      setUploadProgress({});
      setShowUploadModal(false);
    }
  };

  // Handle Create Folder Click
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setMessage("Please enter a folder name.");
      return;
    }

    setCreatingFolder(true);

    const payload = {
      name: newFolderName,
      visibility: folderVisibility,
      course_id: id,
    };
    if (parent) payload.parent = parent;

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/make-dir`,
        payload,
        {
          headers: {
            auth_token: localStorage.getItem("auth_token") || null,
          },
        }
      );

      setLoadingContent(true);

      // Refresh content after upload
      const contentRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/show-content`,
        {
          course_id: id,
          ...(parent && { parent: parent }),
        }
      );
      setContentDir(contentRes.data.directories);
      setContentFiles(contentRes.data.files);
    } catch (error) {
      console.error("Error creating folder:", error);
      setMessage("Failed to create folder.");
    } finally {
      setCreatingFolder(false);
      setNewFolderName("");
      setLoadingContent(false);
      setFolderVisibility("public");
      setShowCreateFolderModal(false);
    }
  };

  // Handle "Add File" or "New Folder" button click
  const handleAddContent = (type) => {
    if (type === "New File") {
      setShowUploadModal(true);
    } else {
      console.log(`Add new content: ${type}`);
    }
  };

  // Handle folder navigation
  const handleNavigate = (newParent) => {
    setParent(newParent._id);
    setPwd([...pwd, newParent]);
  };

  const canAccessFile = (file) => {
    return userType === "admin" || file.visibility !== "private";
  };

  const handleBack = () => {
    if (pwd.length > 0) {
      const newPwd = [...pwd];
      newPwd.pop(); // Remove the last directory in path
      setPwd(newPwd);
      setParent(newPwd.length > 0 ? newPwd[newPwd.length - 1]._id : null);
    }
  };
  if (loadingCourse) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const discountedPrice = course.course_price - course.course_discount;
  const discountPercentage = (
    (course.course_discount / course.course_price) *
    100
  ).toFixed(0);

  // Handle File Playing
  const handleFilePlay = async (file) => {
    setFileLoading(true);
    setFileError(null);
    setCurrentFile(file);
    setShowFileModal(true);
  };

  // Handle edit button click
  const handleEdit = () => {
    console.log("Edit course:", course);
  };

  if (loadingCourse) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

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

          {/* Main Content Section */}
          <div className="col-lg-8 order-2 order-lg-2 bg-light p-4 rounded shadow-sm">
            <h2>{course.course_name}</h2>
            <p>Manage course content like videos, modules, or documents.</p>
            <div className="add-content mb-4">
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => {
                  setShowCreateFolderModal(true);
                }}
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

            {loadingContent ? (
              <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <>
                <button className="btn mx-0" onClick={handleBack}>
                  <i className="fa-regular fa-hand-point-left"></i> Back
                </button>
                <button
                  className="btn mx-0"
                  onClick={() => {
                    navigate("/courses");
                  }}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Exit
                </button>
                <div className="breadcrumb mb-3">
                  <div
                    className=""
                    style={{ cursor: "pointer", fontSize: "18px" }}
                    onClick={() => {
                      setParent(null);
                      setPwd([]); // Reset pwd when going back to root
                    }}
                  >
                    Root
                  </div>
                  {pwd.map((directory, index) => (
                    <React.Fragment key={directory._id}>
                      <span className="text text-dark">
                        <i
                          className="fa-solid fa-arrow-right mx-3"
                          style={{ marginTop: "5px" }}
                        ></i>
                      </span>
                      <div
                        className=""
                        style={{ cursor: "pointer", fontSize: "18px" }}
                        onClick={() => {
                          setParent(directory._id);
                          setPwd(pwd.slice(0, index + 1));
                        }}
                      >
                        {directory.fileName}
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <h4 className="my-3">
                  {pwd.length > 0
                    ? pwd[pwd.length - 1].fileName
                    : course.course_name}
                </h4>
                {/* Display Directories */}
                {/* Display Directories */}
                <div className="main-content">
                  {contentDir.length > 0 ? (
                    <div className="d-flex flex-column">
                      {contentDir.map((directory) => (
                        <div key={directory._id} className="mb-3">
                          <div
                            className="folder-card p-3 d-flex align-items-center justify-content-between shadow-sm"
                            onClick={() => handleNavigate(directory)}
                            style={{
                              cursor: "pointer",
                              borderRadius: "10px",
                              background: "#f8f9fa",
                              border: "1px solid #ddd",
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <i className="fas fa-folder fa-2x text-primary"></i>
                              <span className="ms-2">{directory.fileName}</span>
                            </div>
                            {directory.visibility === "private" && (
                              <i
                                className="fas fa-lock text-danger"
                                style={{ fontSize: "18px" }}
                              ></i>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !contentFiles.length > 0 && (
                      <div className="d-flex flex-column justify-content-center align-items-center my-5">
                        <i className="fas fa-folder-open fa-3x text-secondary"></i>
                        <p
                          className="text-muted mt-2"
                          style={{ fontSize: "18px" }}
                        >
                          No content available
                        </p>
                        <button
                          className="btn btn-primary mt-2"
                          onClick={() => handleAddContent("New File")}
                        >
                          Add Content
                        </button>
                      </div>
                    )
                  )}

                  {/* Display Files */}
                  {contentFiles.length > 0 && (
                    <div className="row">
                      {contentFiles.map((file) => (
                        <div key={file._id} className="mb-3">
                          {canAccessFile(file) ? (
                            <div
                              className="file-card p-3 d-flex align-items-center justify-content-between shadow-sm"
                              onClick={() => handleFilePlay(file)}
                              style={{
                                cursor: "pointer",
                                borderRadius: "10px",
                                background: "#ffffff",
                                border: "1px solid #ddd",
                              }}
                            >
                              <div className="d-flex align-items-center">
                                {file.file_type === "video" ? (
                                  <i className="fas fa-file-video fa-2x text-success"></i>
                                ) : (
                                  <i className="fas fa-file-pdf fa-2x text-danger"></i>
                                )}
                                <span className="ms-2">{file.fileName}</span>
                              </div>
                              {file.visibility === "private" && (
                                <i className="fas fa-lock text-danger"></i>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
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

      {/* File Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Files</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Select files to upload (PDF or MP4 only)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.mp4"
              />
            </Form.Group>
            {selectedFiles.map((file) => (
              <div key={file.name} className="file-item mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>
                    {file.type === "video/mp4" ? (
                      <i className="fas fa-file-video text-success me-2"></i>
                    ) : (
                      <i className="fas fa-file-pdf text-danger me-2"></i>
                    )}
                    {file.name}
                  </span>
                  <span
                    className={`${getStatusColor(fileStatuses[file.name])}`}
                  >
                    {fileStatuses[file.name] === "processing" ? (
                      <span>
                        <i className="fas fa-cog fa-spin me-2"></i>
                        Processing
                      </span>
                    ) : fileStatuses[file.name] ? (
                      fileStatuses[file.name].charAt(0).toUpperCase() +
                      fileStatuses[file.name].slice(1)
                    ) : (
                      "Pending"
                    )}
                  </span>
                </div>
                {uploadProgress[file.name] > 0 && (
                  <div className="progress" style={{ height: "20px" }}>
                    <div
                      className={`progress-bar ${
                        fileStatuses[file.name] === "processing"
                          ? "progress-bar-striped progress-bar-animated bg-warning"
                          : fileStatuses[file.name] === "completed"
                          ? "bg-success"
                          : ""
                      }`}
                      role="progressbar"
                      style={{
                        width: `${
                          fileStatuses[file.name] === "processing"
                            ? 100
                            : uploadProgress[file.name]
                        }%`,
                      }}
                      aria-valuenow={
                        fileStatuses[file.name] === "processing"
                          ? 100
                          : uploadProgress[file.name]
                      }
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {fileStatuses[file.name] === "processing"
                        ? "Converting to HLS format..."
                        : `${uploadProgress[file.name]}%`}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        show={showCreateFolderModal}
        onHide={() => setShowCreateFolderModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="folderName">
              <Form.Label>Folder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="folderVisibility" className="mt-3">
              <Form.Label>Visibility</Form.Label>
              <Form.Select
                value={folderVisibility}
                onChange={(e) => setFolderVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCreateFolderModal(false)}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateFolder}
            disabled={creatingFolder}
          >
            {creatingFolder ? "Creating..." : "Create Folder"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        show={showFileModal}
        onHide={() => {
          setShowFileModal(false);
          setFileLoading(false);
          setFileError(null);
          setCurrentFile(null);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{currentFile?.fileName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fileLoading && (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading file...</p>
            </div>
          )}
          {fileError && <div className="alert alert-danger">{fileError}</div>}
          {currentFile?.file_type === "video" ? (
            <div className="video-container">
              {fileLoading && (
                <div className="loading-overlay">
                  <Spinner animation="border" variant="light" />
                  <p className="mt-2 text-light">Loading video...</p>
                </div>
              )}
              <video
                id="videoPlayer"
                controls
                style={{ width: "100%", height: "auto" }}
                onLoadStart={() => setFileLoading(true)}
                onError={(e) => {
                  console.error("Video error:", e);
                  setFileError("Error playing video. Please try again.");
                  setFileLoading(false);
                }}
              />
              {fileError && (
                <div className="alert alert-danger m-3">{fileError}</div>
              )}
            </div>
            ) : currentFile?.file_type === "pdf" ? (
            <div className="pdf-container" style={{ position: 'relative' }}>
              {fileLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000
              }}>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading PDF...</p>
              </div>
              )}
              <div style={{ 
              width: "100%", 
              height: "70vh", 
              overflow: "auto",
              backgroundColor: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px"
              }}>
              <Document
                file={{
                url: `${import.meta.env.VITE_BACKEND_URL}/course/pdf/${currentFile._id}`,
                httpHeaders: {
                  auth_token: localStorage.getItem("auth_token"),
                },
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                console.error("Error loading PDF:", error);
                setFileError("Error loading PDF. Please try again.");
                setFileLoading(false);
                }}
                loading={null}
              >
                <Page
                pageNumber={pageNumber}
                width={window.innerWidth * 0.6}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={() => setFileLoading(false)}
                onRenderError={(error) => {
                  console.error("Error rendering page:", error);
                  setFileError("Error rendering PDF page. Please try again.");
                  setFileLoading(false);
                }}
                />
              </Document>
              </div>
              {numPages && (
              <div className="text-center mt-3 pdf-controls">
                <Button 
                onClick={previousPage} 
                disabled={pageNumber <= 1}
                variant="outline-primary"
                className="me-2"
                >
                <i className="fas fa-chevron-left"></i> Previous
                </Button>
                <span className="mx-3" style={{ fontSize: '1.1em' }}>
                Page {pageNumber} of {numPages}
                </span>
                <Button 
                onClick={nextPage} 
                disabled={pageNumber >= numPages}
                variant="outline-primary"
                className="ms-2"
                >
                Next <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
              )}
              {fileError && (
              <div className="alert alert-danger mt-3">{fileError}</div>
              )}
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CourseView;  