import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import Footer from "./Footer";
import Header from "./Header";
import { MessageContext } from "../Context/MessageContext";
import { useContext } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import GoogleAuthenticator from "./GoogleAuthenticator";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { message, setMessage } = useContext(MessageContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null); // Store the token
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!recaptchaToken) {
      setMessage({ type: "error", text: "Please verify the reCAPTCHA!" });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, recaptchaToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.errors?.map((err) => err.msg).join(", ") ||
          data.error ||
          "Login failed";
        setMessage({ type: "error", text: errorMessage });
        return;
      }

      localStorage.setItem("auth_token", data.auth_token);
      setMessage({ type: "success", text: "Login successful!" });
      setIsLoggedIn(true);
    } catch (err) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-title">Login</h2>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <i className="fas fa-eye-slash"></i> // Hide icon
                ) : (
                  <i className="fas fa-eye"></i> // Show icon
                )}
              </button>
            </div>
          </div>

          <ReCAPTCHA
            className="recaptcha mb-3"
            sitekey={`${import.meta.env.VITE_SITE_KEY}`} // Replace with your actual site key
            onChange={(token) => setRecaptchaToken(token)} // Capture the token
            onExpired={() => setRecaptchaToken(null)} // Handle token expiration
          />

          <button type="submit" className="login-button">
            Login
          </button>

          <div className="google-login">
            <GoogleAuthenticator setMessage={setMessage} navigate={navigate} />
          </div>

          <p className="register-link">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Login;
