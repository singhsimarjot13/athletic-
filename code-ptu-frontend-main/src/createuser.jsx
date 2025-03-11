import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateUser = () => {
  const [formData, setFormData] = useState({ collegeName: "", username: "", password: "" });
  const navigate = useNavigate();

  const handleUserCreation = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/signup", formData, { withCredentials: true });
      alert("User Created Successfully!");
      navigate("/admin-dashboard"); // Redirect to Admin Dashboard
    } catch (error) {
      console.error("Signup Error:", error);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Create User</h2>
      <form onSubmit={handleUserCreation}>
        <input type="text" placeholder="College Name" className="form-control mb-2" onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })} required />
        <input type="text" placeholder="Username" className="form-control mb-2" onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
        <input type="password" placeholder="Password" className="form-control mb-2" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
        <button type="submit" className="btn btn-success w-100">Create User</button>
      </form>
    </div>
  );
};

export default CreateUser;