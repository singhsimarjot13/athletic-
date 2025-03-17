import React, { useState } from "react";
const apiUrl = import.meta.env.VITE_API_URL;
const ExportPage = () => {
  const [event, setEvent] = useState("");
  const [collegeName, setCollegeName] = useState("");

  const downloadExcel = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/student/export?event=${event}&collegeName=${collegeName}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "students_data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to export data!");
    }
  };

  // Function to handle navigation
  const navigateToDashboard = () => {
    window.location.href = "/admin-dashboard"; // replace with your actual dashboard route
  };

  return (
    <>
      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.navTitle}>Admin Panel</div>
        <button onClick={navigateToDashboard} style={styles.navButton}>
          Admin Dashboard
        </button>
      </div>

      {/* Export Content */}
      <div style={styles.container}>
        <h2 style={styles.heading}>Export Student Data</h2>

        {/* Event Filter Dropdown */}
        <select
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          style={styles.input}
        >
          <option value="">All Events</option>
          <option value="4x100m Relay">4x100m Relay</option>
          <option value="4x400m Relay">4x400m Relay</option>

          {/* Male Events */}
          <option value="100M Race-Male">100M Race-Male</option>
          <option value="200M Race-Male">200M Race-Male</option>
          <option value="400M Race-Male">400M Race-Male</option>
          <option value="800M Race-Male">800M Race-Male</option>
          <option value="1500M Race-Male">1500M Race-Male</option>
          <option value="5000M Race-Male">5000M Race-Male</option>
          <option value="10000M Race-Male">10000M Race-Male</option>
          <option value="110M Hurdles-Male">110M Hurdles-Male</option>
          <option value="400M Hurdles-Male">400M Hurdles-Male</option>
          <option value="Long Jump-Male">Long Jump-Male</option>
          <option value="Triple Jump-Male">Triple Jump-Male</option>
          <option value="High Jump-Male">High Jump-Male</option>
          <option value="Shot Put-Male">Shot Put-Male</option>
          <option value="Discus Throw-Male">Discus Throw-Male</option>
          <option value="Javelin Throw-Male">Javelin Throw-Male</option>
          <option value="Hammer Throw-Male">Hammer Throw-Male</option>

          {/* Female Events */}
          <option value="100M Race-Female">100M Race-Female</option>
          <option value="200M Race-Female">200M Race-Female</option>
          <option value="400M Race-Female">400M Race-Female</option>
          <option value="800M Race-Female">800M Race-Female</option>
          <option value="1500M Race-Female">1500M Race-Female</option>
          <option value="3000M Race-Female">3000M Race-Female</option>
          <option value="5000M Race-Female">5000M Race-Female</option>
          <option value="100M Hurdles-Female">100M Hurdles-Female</option>
          <option value="400M Hurdles-Female">400M Hurdles-Female</option>
          <option value="Long Jump-Female">Long Jump-Female</option>
          <option value="Triple Jump-Female">Triple Jump-Female</option>
          <option value="High Jump-Female">High Jump-Female</option>
          <option value="Shot Put-Female">Shot Put-Female</option>
          <option value="Discus Throw-Female">Discus Throw-Female</option>
          <option value="Javelin Throw-Female">Javelin Throw-Female</option>
        </select>

        {/* College Name Filter Input */}
        <input
          type="text"
          placeholder="Enter College Name"
          value={collegeName}
          onChange={(e) => setCollegeName(e.target.value)}
          style={styles.input}
        />

        {/* Export Button */}
        <button onClick={downloadExcel} style={styles.button}>
          Export Data
        </button>
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
    fontSize: "20px",
    fontWeight: "bold",
  },
  navButton: {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  container: {
    textAlign: "center",
    margin: "50px auto",
    padding: "20px",
    width: "400px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
  },
  heading: {
    fontSize: "24px",
    marginBottom: "20px",
  },
  input: {
    width: "90%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default ExportPage;
