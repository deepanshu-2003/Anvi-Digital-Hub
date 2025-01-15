import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Account.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import Header from "./Header";

const Account = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/get-user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              auth_token: token,
            },
          }
        );

        const user = await response.json();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const imageUrl = `${import.meta.env.VITE_BACKEND_URL}/general/image-proxy?url=${encodeURIComponent(user.profile_img)}`;

  return (
    <>
      <Header />
      <div className="account-container">
        <div className="account-header">
          <img
            src={imageUrl}
            alt="Profile"
            className="profile-img"
          />
          <h2>{`${user.first_name || ""} ${user.last_name || ""}`}</h2>
        </div>

        <div className="account-details">
          <div className="detail-item">
            <span className="detail-label">Username:</span>
            <span>{user.username || "Not set"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span>{user.email || "Not provided"}</span>
            <FontAwesomeIcon
              icon={user.email_verified ? faCheckCircle : faTimesCircle}
              className={user.email_verified ? "icon-verified" : "icon-not-verified"}
            />
          </div>

          <div className="detail-item">
            <span className="detail-label">Mobile:</span>
            <span>{user.mobile || "Not set"}</span>
            <FontAwesomeIcon
              icon={user.mobile_verified ? faCheckCircle : faTimesCircle}
              className={user.mobile_verified ? "icon-verified" : "icon-not-verified"}
            />
          </div>

          <button className="edit-btn">
            <FontAwesomeIcon icon={faEdit} /> Edit
          </button>
        </div>
      </div>
    </>
  );
};

export default Account;
