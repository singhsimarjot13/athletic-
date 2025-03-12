import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SportsApp.css";
import axios from "axios";

function SportsAppfemale() {
  const [collegeName, setCollegeName] = useState("Loading...");
  const [athleteData, setAthleteData] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const femaleEvents = [
    "100M Race-Female",
    "200M Race-Female",
    "400M Race-Female",
    "800M Race-Female",
    "1500M Race- Female",
    "3000M Race- Female",
    "5000M Race-Female",
    "100M Hurdles-Female",
    "400M Hurdles-Female",
    "Long Jump-Female",
    "Triple Jump-Female",
    "High Jump-Female",
    "Shot Put-Female",
    "Discus Throw-Female",
    "Javelin Throw-Female",
    "Javelin Throw-Female",
  ];

  const events = femaleEvents;
  const currentEvent = events[currentEventIndex];

  useEffect(() => {
    fetch("http://localhost:5000/user-info", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.collegeName) {
          setCollegeName(data.collegeName);
        } else {
          navigate("/");
        }
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("http://localhost:5000/logout", { credentials: "include" });
    navigate("/");
  };

  const goToNextUnlockedEvent = async () => {
    let nextIndex = currentEventIndex + 1;

    while (nextIndex < events.length) {
      const event = events[nextIndex];
      try {
        const res = await axios.get(
          `http://localhost:5000/student/event-status/${event}`,
          { withCredentials: true }
        );

        if (res.data.status !== "locked") {
          setCurrentEventIndex(nextIndex);
          setIsLocked(false);
          return;
        } else {
          nextIndex++;
        }
      } catch (err) {
        console.error("Error checking lock status:", err);
        nextIndex++;
      }
    }

    // All events locked
    setIsSubmitted(true);
  };

  // Runs when current event changes
  useEffect(() => {
    if (!currentEvent) {
      setIsSubmitted(true);
      return;
    }

    const checkCurrentEventLock = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/student/event-status/${currentEvent}`,
          { withCredentials: true }
        );

        if (res.data.status === "locked") {
          setIsLocked(true);
          setTimeout(() => {
            goToNextUnlockedEvent();
          }, 2000);
        } else {
          setIsLocked(false);
        }
      } catch (err) {
        console.error("Error checking lock status:", err);
      }
    };

    checkCurrentEventLock();
  }, [currentEvent]);

  const handleInputChange = (eventName, studentKey, field, value) => {
    setAthleteData((prev) => {
      const newData = { ...prev };
      if (!newData[eventName]) newData[eventName] = {};
      newData[eventName][studentKey] = {
        ...newData[eventName][studentKey],
        [field]: value,
      };
      return newData;
    });
  };

  const validateFields = (student1) => {
    if (
      !student1.name ||
      !student1.urn ||
      !student1.gmail ||
      !student1.fatherName ||
      !student1.dob ||
      !student1.phoneNumber ||
      !student1.idCard
    ) {
      alert("All fields are required. Please fill in missing details.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const birthDate = new Date(student1.dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    if (!emailRegex.test(student1.gmail)) {
      alert("Invalid email format.");
      return false;
    }
    if (!phoneRegex.test(student1.phoneNumber)) {
      alert("Invalid phone number. Must be 10 digits starting with 6-9.");
      return false;
    }
    if (age > 25) {
      alert("Student age must be 25 or below.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (isLocked) {
      alert("This event is locked. Moving to the next event...");
      setTimeout(() => {
        goToNextUnlockedEvent();
      }, 2000);
      return;
    }
    const currentEvent = events[currentEventIndex];
    const student1 = athleteData[currentEvent]?.student1 || {};
    const student2 = athleteData[currentEvent]?.student2 || {};

    // Validate Student 1
    if (!validateFields(student1)) return;

    // Validate Student 2 only if URN is entered
    if (student2.urn && !validateFields(student2)) return;

    // Calculate age from DOB
    const calculateAge = (dob) => {
      if (!dob) return "";
      const birthDate = new Date(dob);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - birthDate.getFullYear();
      // Adjust age if birthday hasn't occurred yet this year
      if (
        currentDate.getMonth() < birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() &&
          currentDate.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    const formData = new FormData();
    formData.append("collegeName", collegeName);
    formData.append("events", currentEvent);
    formData.append("student1Name", student1.name);
    formData.append("student1URN", student1.urn);
    formData.append("student1Gmail", student1.gmail);
    formData.append("student1FatherName", student1.fatherName);
    formData.append("student1age", calculateAge(student1.dob));
    formData.append("student1PhoneNumber", student1.phoneNumber);
    formData.append("student1Image", student1.idCard);
  

    if (student2.urn) {
      formData.append("student2Name", student2.name);
      formData.append("student2URN", student2.urn);
      formData.append("student2Gmail", student2.gmail);
      formData.append("student2FatherName", student2.fatherName);
      formData.append("student2age", calculateAge(student2.dob));
      formData.append("student2PhoneNumber", student2.phoneNumber);
      if (student2.idCard) {
        formData.append("student2Image", student2.idCard);
      }
    }

    try {
      const response = await fetch("http://localhost:5000/student/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || "Registration Successful!");
        handleNext();
      } else {
        alert(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error. Please try again later.");
    }
  };

  const handleNext = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex((prevIndex) => prevIndex + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="sports-app">
      <nav className="navbar">
        <div className="college-name">{collegeName}</div>
        <div className="nav-buttons">
          <button
            className="female-register-btn"
            onClick={() =>
              (window.location.href = "http://localhost:5173/female-sportsapp")
            }
          >
            Female Sports Register
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="background">
        <h2 className="welcome-text">Welcome to Sports Meet, {collegeName}</h2>
      </div>

      <div className="events-container">
        {!isSubmitted ? (
          <>
            <h3 className="event-title">Register for {currentEvent}</h3>

            {isLocked && (
              <p style={{ color: "red" }}>
                You have already registered for this event. Form is locked.
              </p>
            )}

            {!isLocked && (
              <>
                <div className="athlete-form">
                  <h4>Student 1</h4>
                  <input
                    type="text"
                    placeholder="Name"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "name",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="URN"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "urn",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="email"
                    placeholder="Gmail"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "gmail",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Father's Name"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "fatherName",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "dob",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "phoneNumber",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student1",
                        "idCard",
                        e.target.files[0]
                      )
                    }
                  />

                  <h4>Student 2 (Optional)</h4>
                  <input
                    type="text"
                    placeholder="Name"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student2",
                        "name",
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="URN"
                    onChange={(e) =>
                      handleInputChange(
                        events[currentEventIndex],
                        "student2",
                        "urn",
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Buttons */}
                <button className="skip-btn" onClick={handleNext}>
                  Skip & Next
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={isLocked}
                >
                  Submit & Next
                </button>
              </>
            )}
          </>
        ) : (
          <h2>Thank you for registering!</h2>
        )}
      </div>
    </div>
  );
}

export default SportsAppfemale;