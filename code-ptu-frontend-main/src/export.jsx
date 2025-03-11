import React, { useState } from "react";

const ExportPage = () => {
  const [event, setEvent] = useState("");
  const [collegeName, setCollegeName] = useState("");

  // Function to download Excel file
  const downloadExcel = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/student/export?event=${event}&collegeName=${collegeName}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      // Convert response to blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a download link
      const a = document.createElement("a");
      a.href = url;
      a.download = "students_data.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to export data!");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Export Student Data</h2>

      {/* Event Filter Input */}
      <input
        type="text"
        placeholder="Enter Event Name"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
        style={styles.input}
      />

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
  );
};

// Inline CSS styles
const styles = {
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
