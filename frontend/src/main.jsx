// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";           // <-- your new login page
import "./index.css";

// Firebase
import { auth } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const root = ReactDOM.createRoot(document.getElementById("root"));

// This function decides what to render based on auth status
const renderApp = () => {
  // Show a tiny loading spinner while Firebase connects (optional but nice)
  root.render(
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p>Loading…</p>
    </div>
  );

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in → show the full chat app
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } else {
      // No user → show login screen
      root.render(
        <React.StrictMode>
          <Login />
        </React.StrictMode>
      );
    }
  });
};

renderApp();