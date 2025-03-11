import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [eventsData, setEventsData] = useState({});
  const [eventFilter, setEventFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [eventFilter, collegeFilter]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append("event", eventFilter);
      if (collegeFilter) params.append("collegeName", collegeFilter);

      const res = await axios.get(
        `http://localhost:5000/student/students?${params.toString()}`,
        { withCredentials: true }
      );

      if (res.data.success && Array.isArray(res.data.students)) {
        const groupedEvents = {};
        res.data.students.forEach((studentEntry) => {
          const eventName = studentEntry.event;
          if (!groupedEvents[eventName]) {
            groupedEvents[eventName] = [];
          }

          const { student1, student2 } = studentEntry.students;

          if (student1) {
            groupedEvents[eventName].push({
              name: student1.name || "N/A",
              urn: student1.urn || "N/A",
              collegeName: student1.collegeName || "N/A",
              idCard: student1.idCard || null,
            });
          }
          if (student2) {
            groupedEvents[eventName].push({
              name: student2.name || "N/A",
              urn: student2.urn || "N/A",
              collegeName: student2.collegeName || "N/A",
              idCard: student2.idCard || null,
            });
          }
        });

        setEventsData(groupedEvents);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // Remove token
    navigate("/admin-login"); // Redirect to admin login page
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold">Admin Dashboard</span>
          <div>
            <button className="btn btn-outline-light me-2" onClick={() => navigate("/create-user")}>
              Create User
            </button>
            <Link to="/export" className="btn btn-primary me-2">Export Data</Link>
            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content Section */}
      <div className="container-fluid flex-grow-1 d-flex flex-column">
        <h2 className="text-center fw-bold text-dark mt-3">Event-wise Student List</h2>

        {/* Filter Section */}
        <div className="d-flex justify-content-center gap-3 mb-4">
          <select className="form-select w-25 shadow-sm" onChange={(e) => setEventFilter(e.target.value)}>
            <option value="">All Events</option>
            <option value="100m Race">100m Race</option>
            <option value="Long Jump">Long Jump</option>
          </select>

          <input
            type="text"
            className="form-control w-25 shadow-sm"
            placeholder="Enter College Name"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          />
        </div>

        {/* Display Students by Event */}
        <div className="overflow-auto flex-grow-1 px-3">
          {Object.keys(eventsData).length > 0 ? (
            Object.entries(eventsData).map(([event, students]) => (
              <div className="card shadow-sm mb-4 border-0 w-100" key={event}>
                <div className="card-header bg-primary text-white">
                  <h4 className="m-0">{event}</h4>
                </div>
                <div className="card-body">
                  <table className="table table-hover table-striped w-100">
                    <thead className="table-dark">
                      <tr>
                        <th>Name</th>
                        <th>URN</th>
                        <th>College</th>
                        <th>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((entry, index) => (
                        <tr key={index}>
                          <td className="fw-semibold">{entry.name}</td>
                          <td>{entry.urn}</td>
                          <td>{entry.collegeName}</td>
                          <td>
                            {entry.idCard ? (
                              <img
                                src={entry.idCard}
                                alt="Student"
                                className="rounded shadow-sm"
                                width="50"
                                height="50"
                              />
                            ) : (
                              <span className="text-muted">No Image</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-danger text-center fw-bold">No students found for the selected criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
