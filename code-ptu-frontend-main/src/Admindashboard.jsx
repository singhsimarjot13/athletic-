import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [relayTeams, setRelayTeams] = useState([]);
  const [jerseyData, setJerseyData] = useState([]);
  const [students, setStudents] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchRelayTeams();
    fetchJerseyNumbers();
    fetchStudents();
  }, [eventFilter, collegeFilter]);

  const fetchRelayTeams = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append("event", eventFilter);
      if (collegeFilter) params.append("collegeName", collegeFilter);

      const res = await axios.get(
        `http://localhost:5000/admin/relay?${params.toString()}`,
        { withCredentials: true }
      );
      if (res.data.success) setRelayTeams(res.data.teams);
    } catch (error) {
      console.error("Error fetching relay teams:", error);
    }
  };

  const fetchJerseyNumbers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/admin/jersey-numbers",
        { withCredentials: true }
      );
      if (res.data.success) setJerseyData(res.data.jerseys);
    } catch (error) {
      console.error("Error fetching jersey numbers:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append("event", eventFilter);
      if (collegeFilter) params.append("collegeName", collegeFilter);

      const res = await axios.get(
        `http://localhost:5000/student/students?${params.toString()}`,
        { withCredentials: true }
      );
      if (res.data.success) setStudents(res.data.students);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  const relayEvents = ["4x100m Relay", "4x400m Relay"];

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold fs-4">Admin Dashboard</span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-light"
              onClick={() => navigate("/create-user")}
            >
              Create User
            </button>
            <Link to="/export" className="btn btn-primary">
              Export Data
            </Link>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="container-fluid flex-grow-1 py-4">
        <h2 className="text-center fw-bold text-dark mb-4">
          Relay Teams & Jersey Numbers
        </h2>

        {/* Filters */}
        <div className="d-flex justify-content-center flex-wrap gap-3 mb-4">
          <select
            className="form-select w-25 shadow-sm"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="">All Events</option>
            {[
              ...relayEvents,
              // Male Events
              "100M Race-Male", "200M Race-Male", "400M Race-Male",
              "800M Race-Male", "1500M Race-Male", "5000M Race-Male",
              "10000M Race-Male", "110M Hurdles-Male", "400M Hurdles-Male",
              "Long Jump-Male", "Triple Jump-Male", "High Jump-Male",
              "Shot Put-Male", "Discus Throw-Male", "Javelin Throw-Male",
              "Hammer Throw-Male",
              // Female Events
              "100M Race-Female", "200M Race-Female", "400M Race-Female",
              "800M Race-Female", "1500M Race-Female", "3000M Race-Female",
              "5000M Race-Female", "100M Hurdles-Female",
              "400M Hurdles-Female", "Long Jump-Female", "Triple Jump-Female",
              "High Jump-Female", "Shot Put-Female", "Discus Throw-Female",
              "Javelin Throw-Female"
            ].map((event, index) => (
              <option key={index} value={event}>
                {event}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="form-control w-25 shadow-sm"
            placeholder="Enter College Name"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          />
        </div>

        {/* Relay Teams */}
        <div className="overflow-auto px-3">
          {relayTeams.length > 0 ? (
            relayTeams.map((team, index) => (
              <div
                key={index}
                className="card shadow-sm mb-4 border-0 w-100 bg-white"
              >
                <div className="card-header bg-success text-white">
                  <h4 className="m-0">
                    {team.event} - {team.collegeName}
                  </h4>
                </div>
                <div className="card-body">
                  <table className="table table-hover table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>URN</th>
                        <th>Email</th>
                        <th>Father's Name</th>
                        <th>Age</th>
                        <th>Phone</th>
                        <th>Jersey Number</th>
                        <th>ID Card</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.students?.length > 0 ? (
                        team.students.map((student, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{student.name}</td>
                            <td>{student.urn}</td>
                            <td>{student.gmail}</td>
                            <td>{student.fatherName}</td>
                            <td>{student.age}</td>
                            <td>{student.phoneNumber}</td>
                            <td>{student.jerseyNumber || "Not Allotted"}</td>
                            <td>
                              {student.image ? (
                                <img
                                  src={student.image}
                                  alt="ID Card"
                                  width="50"
                                  height="50"
                                  className="rounded shadow-sm"
                                />
                              ) : (
                                <span className="text-muted">No Image</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center text-muted">
                            No students found for this team.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-danger text-center fw-bold">
              No relay teams found for selected filters.
            </p>
          )}
        </div>

        {/* Students */}
        {(!relayEvents.includes(eventFilter) || eventFilter === "") && (
          <div className="mt-4 px-3">
            <h3 className="fw-bold text-center">Students Entries</h3>
            <table className="table table-hover table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>URN</th>
                  <th>Email</th>
                  <th>Father's Name</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Event</th>
                  <th>College Name</th>
                  <th>ID Card</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((entry, idx) => {
                    const { student1, student2 } = entry.students;
                    const rows = [];

                    if (student1?.name) {
                      rows.push(
                        <tr key={`${idx}-student1`}>
                          <td>{rows.length + 1}</td>
                          <td>{student1.name}</td>
                          <td>{student1.urn}</td>
                          <td>{student1.gmail}</td>
                          <td>{student1.fatherName}</td>
                          <td>{student1.age}</td>
                          <td>{student1.phoneNumber}</td>
                          <td>{entry.event}</td>
                          <td>{entry.collegeName}</td>
                          <td>
                            {student1.idCard ? (
                              <img
                                src={student1.idCard}
                                alt="ID Card"
                                width="50"
                                height="50"
                                className="rounded shadow-sm"
                              />
                            ) : (
                              <span className="text-muted">No Image</span>
                            )}
                          </td>
                        </tr>
                      );
                    }

                    if (student2?.name) {
                      rows.push(
                        <tr key={`${idx}-student2`}>
                          <td>{rows.length + 1}</td>
                          <td>{student2.name}</td>
                          <td>{student2.urn}</td>
                          <td>{student2.gmail}</td>
                          <td>{student2.fatherName}</td>
                          <td>{student2.age}</td>
                          <td>{student2.phoneNumber}</td>
                          <td>{entry.event}</td>
                          <td>{entry.collegeName}</td>
                          <td>
                            {student2.idCard ? (
                              <img
                                src={student2.idCard}
                                alt="ID Card"
                                width="50"
                                height="50"
                                className="rounded shadow-sm"
                              />
                            ) : (
                              <span className="text-muted">No Image</span>
                            )}
                          </td>
                        </tr>
                      );
                    }

                    return rows.length > 0 ? rows : null;
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-muted">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Jersey Numbers */}
        <div className="mt-4 px-3">
          <h3 className="fw-bold text-center">Allotted Jersey Numbers</h3>
          <table className="table table-hover table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Student Name</th>
                <th>URN</th>
                <th>College Name</th>
                <th>Jersey Number</th>
              </tr>
            </thead>
            <tbody>
              {jerseyData.length > 0 ? (
                jerseyData.map((jersey, idx) => (
                  <tr key={idx}>
                    <td>{jersey.studentName}</td>
                    <td>{jersey.urn}</td>
                    <td>{jersey.collegeName}</td>
                    <td>{jersey.jerseyNumber}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No jersey numbers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
