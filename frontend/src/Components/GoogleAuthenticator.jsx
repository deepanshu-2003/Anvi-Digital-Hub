import React from "react";
import { GoogleLogin } from "@react-oauth/google";

const GoogleAuthenticator = ({ setMessage, navigate }) => {
  return (
    <div className="google-login">
      {/* Google Authentication */}
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/auth/google-login`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  token: credentialResponse.credential, // Send the token to the backend
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              setMessage({
                type: "error",
                text: data.error || "Google Sign-Up Failed",
              });
              return;
            }

            setMessage({
              type: "success",
              text: "Google Sign-Up Successful!! Redirecting...",
            });

            // Store authentication token in local storage
            localStorage.setItem("auth_token", data.auth_token);

            // Redirect after a short delay
            navigate("/");
          } catch (err) {
            console.error("Error during Google Sign-Up:", err.message);
            setMessage({
              type: "error",
              text: "Google Sign-Up Failed. Please try again.",
            });
          }
        }}
        onError={() => {
          setMessage({
            type: "error",
            text: "Google Sign-Up Failed. Please try again.",
          });
        }}
      />
    </div>
  );
};

export default GoogleAuthenticator;
