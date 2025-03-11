import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css"; // You can add your custom styles here

const AdminDashboard = () => {
  const [isSignUpVisible, setIsSignUpVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    collegeName: "",
  });
  const [eventData, setEventData] = useState(null);
  const [allowSignup, setAllowSignup] = useState(false); // Tracks the state of Signup
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Toggle Signup form visibility
  const toggleSignUp = () => {
    setIsSignUpVisible((prevState) => !prevState);
  };

  // Handle form data change for Sign Up
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle Sign Up form submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.password || !formData.collegeName) {
      setError("All fields are required!");
      return;
    }

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to sign up");
      }
      navigate("/login"); // Redirect to login page after successful sign-up
    } catch (error) {
      setError("Failed to sign up. Please try again.");
    }
  };

  // Fetch event data when component mounts
  useEffect(() => {
    async function fetchEventData() {
      try {
        const response = await fetch("/admin/dashboard-data");
        const data = await response.json();
        setEventData(data);
        setLoading(false);
      } catch (error) {
        setError("Error fetching event data.");
        setLoading(false);
      }
    }
    fetchEventData();
  }, []);

  // Toggle the Signup Enabled/Disabled state
  const toggleSignupState = async () => {
    try {
      const response = await fetch("/admin/toggle-signup", {
        method: "POST",
      });
      const data = await response.json();
      setAllowSignup(data.allowSignup); // Update the UI based on response
    } catch (error) {
      setError("Error while toggling signup state.");
    }
  };

  return (
    <div>
      <h2 className="text-center mb-4">Admin Dashboard - Event-wise Student List</h2>

      {/* Button to Enable/Disable Signup */}
      <button
        onClick={toggleSignupState} // Call the function on click
        className={`btn ${allowSignup ? "btn-danger" : "btn-success"}`}
      >
        {allowSignup ? "Disable Signup" : "Enable Signup"}
      </button>

      {/* Conditional rendering of Sign Up form */}
      {isSignUpVisible && (
        <div>
          <h3>Sign Up</h3>
          <form onSubmit={handleSignUp}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="collegeName"
              placeholder="College Name"
              value={formData.collegeName}
              onChange={handleChange}
              required
            />
            <button type="submit">Sign Up</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {/* Event Data Display Section */}
      <h3>Event-wise Student List</h3>
      {loading && <p>Loading event data...</p>}
      {error && <p className="error">{error}</p>}

      {/* Displaying the events and student data */}
      {eventData && !loading ? (
        Object.keys(eventData).length > 0 ? (
          Object.keys(eventData).map((event) => (
            <div key={event} className="event-card">
              <h4>{event}</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>URN</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {eventData[event].map((student, index) => (
                    <tr key={index}>
                      <td>{student.name}</td>
                      <td>{student.urn}</td>
                      <td>
                        {student.imageUrl ? (
                          <img src={student.imageUrl} alt={`${student.name}'s ID`} width="50" />
                        ) : (
                          "No Image"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>No students registered for any event yet.</p>
        )
      ) : null}
    </div>
  );
};

export default AdminDashboard;
