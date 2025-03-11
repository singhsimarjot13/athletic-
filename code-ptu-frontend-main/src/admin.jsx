import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors
  
    try {
      const response = await fetch("http://localhost:5000/admin/adminlogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure session is sent
        body: JSON.stringify({ username, password }),
      });
  
      const result = await response.json();
      console.log("Login Response:", result); // Debugging
  
      if (result.success && result.token) {
        localStorage.setItem("adminToken", result.token); // Store token for authentication
        navigate("/admin-dashboard"); // Redirect to admin dashboard
      } else {
        setErrorMessage(result.error || "Invalid credentials, try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage("Server error. Try again later.");
    }
  };

  return (
    <div className="admin-login-container">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;
