import React, { useState } from "react";
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

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirm_password: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
  });
  const [currentPhase, setCurrentPhase] = useState(1); // Track the current phase
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const { message, setMessage } = useContext(MessageContext);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const navigate = useNavigate();


  const verifyEmail = async () => {};
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
      localStorage.setItem('auth_token',data.auth_token);
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
              <label
                  htmlFor="verification"
                 >Verify Email ID </label>
                <button type="button" className="btn btn-secondary verification" onClick={verifyEmail} >Verify Email</button>
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
                <label
                  htmlFor="verification"
                 >Verify Mobile Number</label>
                <button type="button" className="btn btn-secondary verification" onClick={verifyMobile}>Verify Mobile</button>
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
