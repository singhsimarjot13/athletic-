import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL;
const CreateUser = () => {
  const [formData, setFormData] = useState({
    collegeName: "",
    username: "",
    password: "",
  });

  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/user/users`, {
        withCredentials: true,
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreation = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        // Update existing user
        await axios.put(
          `${apiUrl}/user/users/${formData._id}`,
          formData,
          { withCredentials: true }
        );
        alert("User Updated Successfully!");
      } else {
        // Create new user
        await axios.post(`${apiUrl}/user/signup`, formData, {
          withCredentials: true,
        });
        alert("User Created Successfully!");
      }

      setFormData({ collegeName: "", username: "", password: "" });
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
      alert(
        error.response?.data?.error || "Something went wrong. Check console!"
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${apiUrl}/user/users/${id}`, {
          withCredentials: true,
        });
        alert("User deleted successfully");
        fetchUsers();
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete user");
      }
    }
  };

  const handleEdit = (user) => {
    setFormData({
      _id: user._id,
      collegeName: user.collegeName,
      username: user.username,
      password: "", // Always blank! User must enter new password if changing
    });
    alert(
      "Edit user info. Leave password blank if you don't want to change it."
    );
  };

  return (
    <>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <h3 style={styles.navTitle}>Admin Panel</h3>
        <button
          style={styles.dashboardBtn}
          onClick={() => navigate("/admin-dashboard")}
        >
          Admin Dashboard
        </button>
      </nav>

      {/* Create/Edit User Form */}
      <div className="container mt-5" style={styles.container}>
        <h2>{formData._id ? "Edit User" : "Create User"}</h2>
        <form onSubmit={handleUserCreation}>
          <input
            type="text"
            placeholder="College Name"
            className="form-control mb-2"
            value={formData.collegeName}
            onChange={(e) =>
              setFormData({ ...formData, collegeName: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Username"
            className="form-control mb-2"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder={
              formData._id
                ? "Enter new password to change (optional)"
                : "Password"
            }
            className="form-control mb-2"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required={!formData._id} // required only in create mode
          />
          <button type="submit" className="btn btn-success w-100">
            {formData._id ? "Update User" : "Create User"}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="container mt-5" style={styles.container}>
        <h3>User List</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>College Name</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.collegeName}</td>
                  <td>{user.username}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(user._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#343a40",
    color: "white",
  },
  navTitle: {
    margin: 0,
  },
  dashboardBtn: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
  },
};

export default CreateUser;
