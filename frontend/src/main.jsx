import React from "react";
import ReactDOM from "react-dom/client"; // Use createRoot from ReactDOM
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MessageProvider from "./Context/MessageContext";
import "./index.css";
import App from "./App";
import Header from "./Components/Header";
const clientId = `${import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID}`;
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={clientId}>
        <MessageProvider>
          <App />
        </MessageProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
