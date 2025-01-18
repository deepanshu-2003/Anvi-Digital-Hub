import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import { useContext } from "react";
import { MessageContext } from "../Context/MessageContext";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner"; // Import Spinner from React Bootstrap

const Course = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const { message, setMessage } = useContext(MessageContext);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/course/get/${id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
        setError("Error fetching course details."); // Set error message
      }
    };

    fetchCourse();
  }, [id]);

  const handleBuyNow = async () => {
    // Determine the discounted price
    const discountedPrice = course.course_price - course.course_discount;

    try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/payment/initiate`, {
            orderId: `order_${id}`,
            orderAmount: discountedPrice,
            customerEmail: "customer@example.com",
            customerPhone: "1234567890"
        });

        if (response.status === 200) {
            const options = {
                key: response.data.key,
                amount: response.data.amount,
                currency: response.data.currency,
                name: "Anvi Digital Hub",
                description: "Purchase Course",
                image: "/logo.png",
                order_id: response.data.id,
                handler: async function (response) {
                    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/payment/response`, {
                        orderId: `order_${id}`,
                        amount: discountedPrice,
                        currency: "INR",
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        status: "success"
                    });
                    setMessage({type:"success",text:"Course Purchased Successfully."});
                },
                prefill: {
                    email: "customer@example.com",
                    contact: "1234567890"
                },
                theme: {
                    color: "#F37254"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            setMessage({ type: 'error', text: 'Error initiating payment' });
        }
    } catch (error) {
        console.error("Error initiating payment:", error);
        setMessage({ type: 'error', text: 'Error initiating payment' });
    }
};


  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!course) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />{" "}
        {/* Add loading spinner */}
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
          <div className="col-lg-4 order-lg-2 bg-white p-4 mb-3">
            <div className="course-details">
              <img
                src={course.course_img}
                alt={course.course_name}
                className="img-fluid mb-3"
                style={{ borderRadius: "10px" }}
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
                <strong>Status:</strong> {course.course_status}
              </p>
            </div>
          </div>

          <div className="col-lg-8 order-lg-1 bg-light p-4">
            <h2>Main Section</h2>
            <p>
              This is where you can add other course content like videos,
              modules, or descriptions.
            </p>
            <div style={{ height: "300px", background: "#f8f9fa" }}>
              Content goes here...
            </div>
            <div
              className="fixed-bottom-bar"
              style={{
                position: "fixed",
                bottom: "0",
                left: "0",
                width: "100%",
                height: "62px",
                backgroundColor: "#ffffff",
                boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
                padding: "15px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #ddd",
                zIndex: 1000,
              }}
            >
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Course;
