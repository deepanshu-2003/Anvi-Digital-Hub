import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import Header from "./Header";
import { MessageContext } from "../Context/MessageContext";
import { useContext } from "react";
import Footer from "./Footer";
import ReCAPTCHA from "react-google-recaptcha";
// import {Link} from 'react-router-dom';
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import GoogleAuthenticator from "./GoogleAuthenticator";
import axios from "axios";


const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    email_verified:false,
    mobile: "",
    mobile_verified : false,
    password: "",
    confirm_password: "",
  });

  const [currentPhase, setCurrentPhase] = useState(1); // Track the current phase
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const { message, setMessage } = useContext(MessageContext);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [emailVerification, setEmailVerification] = useState(false); // clicked on verification button
  const [emailVerified,setEmailVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();
  let timerInterval = null;
  const startTimer = () => {
    setTimer(30); // 30 seconds countdown
    clearInterval(timerInterval); // Clear existing timer if any
    timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval); // Stop timer
          setTimer(0); // Reset timer
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let interval;
    if (!formData.email_verified) {
      interval = setInterval(async () => {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/auth/email-verify-status`,
            { email: formData.email }
          );
          if (response.data.status) {
            setFormData((prev) => ({ ...prev, email_verified: true }));
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error checking email verification status:", error);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [formData.email]);

  // Email Verification function .................
  const verifyEmail = async () => {
    const email = formData.email;
    if (!email) {
      setMessage({ type: "error", text: "Enter a valid email" });
      return;
    }
    try {
      setEmailVerification(true);
      startTimer();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/send-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.errors[0].msg || "Error sending verification mail.",
        });
        setEmailVerification(false);
        return;
      }
      if(data.message === "Email Verified successfuly."){
        setEmailVerified(true);
        setEmailVerification(false);
      }
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: "Error sending verification mail." });
      setEmailVerification(false);
      console.error("Error hitting End point:", err.message);
    }
  };

  // Verification of mobile number............
  const verifyMobile = async () => {};

  const checkUsernameAvailability = async (username) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/general/username-available?username=${username}`,
        { method: "GET" }
      );
      const data = await response.json();
      setUsernameAvailable(data.available);
      console.log("data", data.available);
    } catch (err) {
      console.error("Error checking username availability:", err.message);
    }
  };

  const validateUsername = async (username) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/general/validate-username?username=${username}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (!data.valid) {
        setMessage({
          type: "error",
          text: "Username should not contain special characters or spaces",
        });
      } else {
        setMessage(null);
      }
    } catch (err) {
      console.error("Error validating username:", err.message);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "email" && formData.email_verified) {
      return;
    }
    if (e.target.name === "email" && emailVerification) {
      if(timer===0){
        setEmailVerification(false);
      }else{return;}
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "username" && e.target.value.length > 2) {
      checkUsernameAvailability(e.target.value);
      validateUsername(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!recaptchaToken) {
      setMessage({ type: "error", text: "Please complete the reCAPTCHA." });
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/create-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, recaptchaToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors
          ? data.errors[data.errors.length - 1].msg // Get only the last message
          : data.error || "Registration failed. Please try again.";
        setMessage({ type: "error", text: errorMsg });
        return;
      }

      setMessage({
        type: "success",
        text: "Registration successful.",
      });
      // console.log(data.auth_token);
      localStorage.setItem("auth_token", data.auth_token);
      navigate("/");
    } catch (err) {
      console.error("Error during registration:", err.message);
      setMessage({ type: "error", text: err.message });
    }
  };

  const renderPhase = () => {
    switch (currentPhase) {
      case 1:
        return (
          <>
            <div className="row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
              {
                <p className="username-availability-icon">
                  {usernameAvailable ? (
                    <i
                      className="fas fa-check-circle"
                      style={{ color: "green" }}
                    ></i>
                  ) : (
                    <i
                      className="fas fa-times-circle"
                      style={{ color: "red" }}
                    ></i>
                  )}
                </p>
              }
              {
                <p className="username-availability">
                  {usernameAvailable ? "Available" : "Not available"}
                </p>
              }
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="verification">Verify Email ID </label>
                {/* Verification button */}
                {!emailVerification && !formData.email_verified? (
                  <button
                    type="button"
                    className="btn btn-secondary verification"
                    onClick={verifyEmail}
                  >
                    Verify Email
                  </button>
                ) : (
                  <>
                    {emailVerification && timer > 0 && !formData.email_verified && (
                      <span className="timer-message">Resend in {timer}s</span>
                    )}
                    {emailVerification && timer === 0 && !formData.email_verified &&(
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary verification"
                          onClick={verifyEmail}
                        >
                          Resend Email
                        </button>
                        {/* <button type="button" className="btn btn-secondary verification" onClick={()=>{
                          setEmailVerification(false);
                        }}>Change Email</button> */}
                      </>
                    )}
                   {formData.email_verified && (
                    <>
                      <span className="verified-message">Email Verified successfully</span>
                      <i
                        className="fas fa-check-circle"
                        style={{ color: "green" }}
                      ></i>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Verify email and mobile button  */}
            <div className="row">
              <div className="form-group">
                <label htmlFor="mobile">Mobile</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="verification">Verify Mobile Number</label>
                <button
                  type="button"
                  className="btn btn-secondary verification"
                  onClick={verifyMobile}
                >
                  Verify Mobile
                </button>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <div className="row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="register-container">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2 className="register-title">Register</h2>
          {renderPhase()}
          {currentPhase === 3 && (
            <ReCAPTCHA
              className="recaptcha mb-3"
              sitekey={`${import.meta.env.VITE_SITE_KEY}`}
              onChange={(token) => setRecaptchaToken(token)}
              onExpired={() => setRecaptchaToken(null)}
            />
          )}
          <div className="navigation-buttons">
            {currentPhase > 1 && (
              <button
                type="button"
                onClick={() => setCurrentPhase((prev) => prev - 1)}
              >
                Back
              </button>
            )}
            {currentPhase < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentPhase((prev) => prev + 1)}
              >
                Next
              </button>
            ) : (
              <button type="submit" className="register-button">
                Submit
              </button>
            )}
          </div>
          {currentPhase == 1 ? (
            <div>
              <div className="google-login-container">
                <GoogleAuthenticator
                  setMessage={setMessage}
                  navigate={navigate}
                  text="Continue with Google" // Updated text
                />
              </div>
              {/* Login if Already Registered */}
              <p className="login-link">
                Already have Account?{" "}
                <span onClick={() => navigate("/login")}>Login</span>
              </p>
            </div>
          ) : (
            ""
          )}
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Register;
