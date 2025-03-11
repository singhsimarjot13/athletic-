import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Added axios
import "./SportsApp.css"; // Same styling as SportsApp

function Relayfemale() {
  const [collegeName, setCollegeName] = useState("Loading...");
  const [relayData, setRelayData] = useState({});
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const navigate = useNavigate();

  const femaleRelayEvents = ["4x100m Relay Female", "4x400m Relay Female"];
  const relayEvents = femaleRelayEvents;
  const currentRelayEvent = relayEvents[currentEventIndex];

  // Fetch college info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get("http://localhost:5000/user-info", {
          withCredentials: true,
        });
        if (res.data.collegeName) {
          setCollegeName(res.data.collegeName);
        } else {
          navigate("/");
        }
      } catch (err) {
        navigate("/");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:5000/logout", {
        withCredentials: true,
      });
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Check lock status for each event
  const goToNextUnlockedEvent = async () => {
    let nextIndex = currentEventIndex + 1;

    while (nextIndex < relayEvents.length) {
      const event = relayEvents[nextIndex];
      try {
        const res = await axios.get(
          `http://localhost:5000/relay/relay-status/${event}`,
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
    if (!currentRelayEvent) {
      setIsSubmitted(true);
      return;
    }

    const checkCurrentEventLock = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/relay/relay-status/${currentRelayEvent}`,
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
  }, [currentRelayEvent]);

  const handleInputChange = (eventName, studentKey, field, value) => {
    setRelayData((prev) => {
      const newData = { ...prev };
      if (!newData[eventName]) newData[eventName] = {};
      newData[eventName][studentKey] = {
        ...newData[eventName][studentKey],
        [field]: value,
      };
      return newData;
    });
  };

  const validateFields = (student) => {
    if (
      !student.name ||
      !student.urn ||
      !student.gmail ||
      !student.fatherName ||
      !student.dob ||
      !student.phoneNumber
    ) {
      alert("All fields are required. Please fill in missing details.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const birthDate = new Date(student.dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    if (!emailRegex.test(student.gmail)) {
      alert("Invalid email format.");
      return false;
    }
    if (!phoneRegex.test(student.phoneNumber)) {
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
      alert("This event is locked. You cannot register again.");
      return;
    }

    const currentRelayEvent = relayEvents[currentEventIndex];
    const eventData = relayData[currentRelayEvent] || {};

    // Validate all 4 students
    for (let i = 1; i <= 4; i++) {
      const student = eventData[`student${i}`] || {};
      if (!validateFields(student)) return;
    }

    const calculateAge = (dob) => {
      if (!dob) return "";
      const birthDate = new Date(dob);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - birthDate.getFullYear();
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
    formData.append("relayEvent", currentRelayEvent);

    for (let i = 1; i <= 4; i++) {
      const student = eventData[`student${i}`] || {};
      formData.append(`student${i}Name`, student.name);
      formData.append(`student${i}URN`, student.urn);
      formData.append(`student${i}Gmail`, student.gmail);
      formData.append(`student${i}FatherName`, student.fatherName);
      formData.append(`student${i}age`, calculateAge(student.dob));
      formData.append(`student${i}PhoneNumber`, student.phoneNumber);
      if (student.idCard) {
        formData.append(`student${i}Image`, student.idCard);
      }
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/relay/register",
        formData,
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        alert(res.data.message || "Relay Registration Successful!");
        handleNext();
      } else {
        alert(res.data.message || "Relay Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting relay data:", error);
      alert("Server error. Please try again later.");
    }
  };

  const handleNext = () => {
    if (currentEventIndex < relayEvents.length - 1) {
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
            onClick={() => navigate("/female-relayapp")}
          >
            Female Sports Register
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="background">
        <h2 className="welcome-text">
          Welcome to Relay Event Registration, {collegeName}
        </h2>
      </div>

      <div className="events-container">
        {!isSubmitted ? (
          <>
            <h3 className="event-title">
              Register for {relayEvents[currentEventIndex]}
            </h3>

            {isLocked ? (
              <p style={{ color: "red" }}>
                You have already registered for this event. Form is locked.
              </p>
            ) : (
              <>
                <div className="athlete-form">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="student-form">
                      <h4>Student {num}</h4>
                      <input
                        type="text"
                        placeholder="Name"
                        onChange={(e) =>
                          handleInputChange(
                            relayEvents[currentEventIndex],
                            `student${num}`,
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
                            relayEvents[currentEventIndex],
                            `student${num}`,
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
                            relayEvents[currentEventIndex],
                            `student${num}`,
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
                            relayEvents[currentEventIndex],
                            `student${num}`,
                            "fatherName",
                            e.target.value
                          )
                        }
                      />
                      <input
                        type="date"
                        onChange={(e) =>
                          handleInputChange(
                            relayEvents[currentEventIndex],
                            `student${num}`,
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
                            relayEvents[currentEventIndex],
                            `student${num}`,
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
                            relayEvents[currentEventIndex],
                            `student${num}`,
                            "idCard",
                            e.target.files[0]
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
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
          <h2>Thank you for registering your relay teams!</h2>
        )}
      </div>
    </div>
  );
}

export default Relayfemale;
