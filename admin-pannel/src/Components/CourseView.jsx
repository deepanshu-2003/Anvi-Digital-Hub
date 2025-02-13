import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import axios from "axios";
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
  const [selectedFile, setSelectedFile] = useState(null);
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
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file to upload.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("course_id", id);
    if (parent) formData.append("parent", parent);

    try {
      const token = localStorage.getItem("auth_token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/upload-file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            auth_token: token,
          },
        }
      );

      setMessage("File uploaded successfully!");
      setShowUploadModal(false);
      setSelectedFile(null);

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
      console.error("Error uploading file:", error);
      setMessage("Failed to upload file.");
    } finally {
      setUploading(false);
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
      const token = localStorage.getItem("auth_token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/course/make-dir`,
        payload,
        {
          headers: { auth_token: token },
        }
      );
      // setMessage("Folder created successfully!");

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

  //  Handle File Playing
  const handleFilePlay = (file) => {
    // setMessage({type:"success",text:"File Played successfully...."})
  };

  // Handle edit button click
  const handleEdit = () => {
    console.log("Edit course:", course);
    if (loadingCourse) {
      return (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }
  };

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
                <button className="btn mx-0" onClick={()=>{navigate("/courses")}}>
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
                    <>
                      <span className="text text-dark">
                        {" "}
                        <i
                          className="fa-solid fa-arrow-right mx-3"
                          style={{ marginTop: "5px" }}
                        ></i>{" "}
                      </span>
                      <div
                        key={directory._id}
                        className=""
                        style={{ cursor: "pointer", fontSize: "18px" }}
                        onClick={() => {
                          // Navigate back to the selected directory
                          setParent(directory._id);
                          setPwd(pwd.slice(0, index + 1)); // Keep the path up to the clicked directory
                        }}
                      >
                        {directory.fileName}
                      </div>
                    </>
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
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Select a file to upload</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
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
    </>
  );
};

export default CourseView;
