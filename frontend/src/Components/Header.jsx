import React, { useEffect, useState, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { MessageContext } from "../Context/MessageContext";
import Message from "./Message";
import logo from "/logo192.png"; // Adjust the path as needed
import axios from "axios";
import "./Header.css";

// Reusable User Dropdown Component
const UserDropdown = ({ isLoggedIn, user, handleLogout }) => (
  <div className="dropdown me-3">
    <button
      className="btn user-btn dropdown-toggle"
      type="button"
      id="userDropdown"
      data-bs-toggle="dropdown" 
      aria-expanded="false"
      aria-haspopup="true"
    >
      {isLoggedIn ? (
        <img
          src={user.profileImg || "https://via.placeholder.com/150"}
          alt="Profile"
          className="profile-header"
        />
      ) : (
        user.name
      )}
    </button>
    <ul className="dropdown-menu user-dropdown" aria-labelledby="userDropdown">
      {isLoggedIn ? (
        <>
          <li className="username">{user.name}</li>
          <li>
            <hr className="dropdown-divider" />
          </li>
          <li>
            <Link className="dropdown-item" to="/account">
              Account
            </Link>
          </li>
          <li>
            <button className="dropdown-item" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </>
      ) : (
        <li>
          <Link className="dropdown-item" to="/login">
            Login Now
          </Link>
        </li>
      )}
    </ul>
  </div>
);

const Header = () => {
  const location = useLocation();
  const { message, setMessage } = useContext(MessageContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [user, setUser] = useState({
    name: localStorage.getItem("user") || "Guest User",
    profileImg: localStorage.getItem("profile_img") || null,
  });
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Validate JWT Token and Fetch User Details
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        handleLogout();
        return false;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/validate-token`,
          { auth_token: token }
        );

        if (response.status !== 200) {
          handleLogout();
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error validating token:", error);
        handleLogout();
        return false;
      }
    };

    const fetchUserDetails = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUser({ name: "Guest User", profileImg: null });
        localStorage.setItem("user", "Guest User");
        localStorage.setItem("profile_img", null);
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/get-user`,
          {},
          { headers: { auth_token: token } }
        );

        if (response.status !== 200) {
          throw new Error(`Error: ${response.status}`);
        }

        const { first_name, last_name, profile_img, email_verified } =
          response.data;
        const username = `${first_name} ${last_name}`;
        setUser({ name: username, profileImg: profile_img });
        setIsEmailVerified(email_verified);
        localStorage.setItem("user", username);
        localStorage.setItem("profile_img", profile_img);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setUser({ name: "Guest User", profileImg: null });
        localStorage.setItem("user", "Guest User");
        localStorage.setItem("profile_img", null);
      }
    };

    const initializeUser = async () => {
      const isValidToken = await validateToken();
      if (!isValidToken) return;

      const token = localStorage.getItem("auth_token");
      setIsLoggedIn(!!token);

      if (!localStorage.getItem("user")) {
        await fetchUserDetails();
      }
    };

    if (!initialized) {
      initializeUser().then(() => setInitialized(true));
    }
  }, [initialized]);

  // Logout Functionality
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser({ name: "Guest User", profileImg: null });
    setInitialized(false);
    // navigate("/");
  };

  // Active Menu Link Check
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {" "}
      <header className="custom-header text-white shadow-sm py-0">
        {" "}
        <nav className="navbar navbar-expand-lg navbar-dark container my-1">
          {" "}
          {/* Offcanvas Navigation */}{" "}
          <button
            className="navbar-toggler me-3"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasNavbar"
            aria-controls="offcanvasNavbar"
          >
            {" "}
            <i className="fas fa-bars"></i> {/* Font Awesome Icon */}{" "}
          </button>{" "}
          <Link
            className="navbar-brand fw-bold d-flex align-items-center"
            to="/"
          >
            {" "}
            <img src={logo} alt="Logo" className="logo me-2" /> Anvi Digital Hub{" "}
          </Link>{" "}
          {/* Offcanvas Menu */}{" "}
          <div
            className="offcanvas offcanvas-start"
            id="offcanvasNavbar"
            data-bs-scroll="true"
          >
            {" "}
            <div className="offcanvas-header">
              {" "}
              <h5 className="offcanvas-title">Anvi Digital Hub</h5>{" "}
              <button
                className="btn-close unique-close-button"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              >
                {" "}
                <i className="fas fa-times-circle"></i>{" "}
                {/* Font Awesome Close Icon */}{" "}
              </button>{" "}
            </div>{" "}
            <div className="offcanvas-body">
              {" "}
              <ul className="navbar-nav ms-auto">
                {" "}
                {["Home", "Services", "Courses", "About", "Contact"].map(
                  (menu) => (
                    <li className="nav-item" key={menu}>
                      {" "}
                      <Link
                        className={`nav-link fw-semibold ${
                          isActive(`/${menu.toLowerCase()}`) ? "active" : ""
                        }`}
                        to={`/${menu.toLowerCase()}`}
                      >
                        {" "}
                        {menu}{" "}
                      </Link>{" "}
                    </li>
                  )
                )}{" "}
              </ul>{" "}
            </div>{" "}
          </div>{" "}
          {/* User Section */}{" "}
          <UserDropdown
            isLoggedIn={isLoggedIn}
            user={user}
            handleLogout={()=>{
              navigate("/");
              handleLogout();
            }}
          />{" "}
        </nav>{" "}
      </header>{" "}
      {/* Message Component */}{" "}
      {message && (
        <Message
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}{" "}
    </>
  );
};

export default Header;
