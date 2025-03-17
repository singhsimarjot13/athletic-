import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import leftLogo from "/logo1.png"; // Left Logo
import rightLogo from "/logo2.png"; // Right Logo
const apiUrl = import.meta.env.VITE_API_URL;

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        navigate("/home");
      } else {
        alert(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed. Please try again.");
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Heading with Logos */}
      <div className="heading-container">
        <img src={leftLogo} alt="Left Logo" className="left-logo" />
        <h1 className="main-heading">27th I.K. Gujral Punjab Technical University Athletic Meet</h1>
        <img src={rightLogo} alt="Right Logo" className="right-logo" />
      </div>

      {/* Login Card */}
      <div className="login-card">
        <h2 className="login-title">Welcome to Registration</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input-field"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
            disabled={loading}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;