import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SportsApp.css";
import axios from "axios";

function Relay() {
  const [collegeName, setCollegeName] = useState("Loading...");
  const [relayData, setRelayData] = useState({});
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [urnErrors, setUrnErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleNavigation = (path) => {
    navigate(path);
  };

  const maleRelayEvents = ["4x100m Relay", "4x400m Relay"];
  const relayEvents = maleRelayEvents;

  const currentRelayEvent = relayEvents[currentEventIndex];

  // Fetch college name on mount
  useEffect(() => {
    fetch(`${apiUrl}/user-info`, { credentials: "include" })
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

  // Move to next unlocked event
  const goToNextUnlockedEvent = async () => {
    let nextIndex = currentEventIndex + 1;

    while (nextIndex < relayEvents.length) {
      const event = relayEvents[nextIndex];
      try {
        const res = await axios.get(
          `${apiUrl}/relay/relay-status/${event}`,
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

    setIsSubmitted(true);
  };

  // Check event lock status on event change
  useEffect(() => {
    if (!currentRelayEvent) {
      setIsSubmitted(true);
      return;
    }

    const checkCurrentEventLock = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/relay/relay-status/${currentRelayEvent}`,
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

  const handleLogout = async () => {
    await fetch(`${apiUrl}/logout`, { credentials: "include" });
    navigate("/");
  };

  const handleInputChange = async (eventName, studentKey, field, value) => {
    setRelayData((prev) => {
      const newData = { ...prev };
      if (!newData[eventName]) newData[eventName] = {};
      newData[eventName][studentKey] = {
        ...newData[eventName][studentKey],
        [field]: value,
      };
      return newData;
    });

    if (field === "urn") {
      // Local Duplicate Check
      const eventData = relayData[eventName] || {};
      let duplicateFound = false;

      Object.entries(eventData).forEach(([otherStudentKey, otherStudentData]) => {
        if (
          otherStudentKey !== studentKey &&
          otherStudentData?.urn === value
        ) {
          duplicateFound = true;
        }
      });

      if (duplicateFound) {
        setUrnErrors((prev) => ({
          ...prev,
          [studentKey]: `URN ${value} is duplicated with another student.`,
        }));
        return; // Skip backend check if local duplicate found
      }

      // Backend Duplicate Check
      try {
        const res = await axios.get(
          `${apiUrl}/relay/check-urn/${value}`,
          { withCredentials: true }
        );

        if (res.data.exists) {
          setUrnErrors((prev) => ({
            ...prev,
            [studentKey]: `URN ${value} is already registered in ${res.data.event} by ${res.data.college}.`,
          }));
        } else {
          setUrnErrors((prev) => ({
            ...prev,
            [studentKey]: "",
          }));
        }
      } catch (err) {
        console.error("Error checking URN:", err);
      }
    }
  };

  const validateFields = (student) => {
    if (
      !student.name ||
      !student.urn ||
      !student.gmail ||
      !student.fatherName ||
      !student.dob ||
      !student.phoneNumber ||
      !student.idCard
    ) {
      alert("All fields are required. Please fill in missing details.");
      isSubmitting(false);
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
      alert("This event is locked. Moving to the next event...");
      setTimeout(() => {
        goToNextUnlockedEvent();
      }, 2000);
      return;
    }
    setIsSubmitting(true); // ⬅️ Start Loading
    const hasUrnErrors = Object.values(urnErrors).some(
      (error) => error && error.length > 0
    );

    if (hasUrnErrors) {
      alert("One or more URNs are invalid or duplicated. Please fix them before submitting.");
      return;
    }

    const eventData = relayData[currentRelayEvent] || {};

    // Validate all 4 students
    for (let i = 1; i <= 4; i++) {
      const student = eventData[`student${i}`] || {};
      if (!validateFields(student)){      setIsSubmitting(false); return;} // ⬅️ Fix
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
      const response = await fetch(`${apiUrl}/relay/register`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();
      if (result.success) {
        if (typeof result.message === "object") {
          alert(result.message.info || JSON.stringify(result.message));
        } else {
          alert(result.message || "Relay Registration Successful!");
          setFormKey((prevKey) => prevKey + 1);
          window.scrollTo({ top: 0, behavior: "smooth" }); // ⬅️ Scroll to top
        }

        goToNextUnlockedEvent();
      } else {
        if (typeof result.message === "object") {
          alert(result.message.error || JSON.stringify(result.message));
        } else {
          alert(result.message || "Relay Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error. Please try again later.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="sports-app">
      <nav className="navbar">
        <div className="college-name">{collegeName}</div>
        <div className="nav-buttons">
        <button className="btn btn-primary" onClick={() => handleNavigation("/home")}>Dashboard</button>
          <button
            className="female-register-btn"
            onClick={() =>
              (window.location.href = "http://localhost:5173/female-relayapp")
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
        <h2 className="welcome-text">
          Welcome to Relay Event Registration, {collegeName}
        </h2>
      </div>

      <div className="events-container">
        {!isSubmitted && currentRelayEvent ? (
          <>
            <h3 className="event-title">Register for {currentRelayEvent}</h3>

            {isLocked ? (
              <p style={{ color: "red" }}>
                You have already registered for this event. Form is locked.
              </p>
            ) : (
              <>
                <div className="athlete-form"  key={formKey}>
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="student-form">
                      <h4>Student {num}</h4>
                      <input
                        type="text"
                        placeholder="Name"
                        onChange={(e) =>
                          handleInputChange(
                            currentRelayEvent,
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
                            currentRelayEvent,
                            `student${num}`,
                            "urn",
                            e.target.value
                          )
                        }
                      />
                      {urnErrors[`student${num}`] && (
                        <p
                          style={{
                            color: "red",
                            fontSize: "0.9em",
                            marginTop: "4px",
                          }}
                        >
                          {urnErrors[`student${num}`]}
                        </p>
                      )}

                      <input
                        type="email"
                        placeholder="Gmail"
                        onChange={(e) =>
                          handleInputChange(
                            currentRelayEvent,
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
                            currentRelayEvent,
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
                            currentRelayEvent,
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
                            currentRelayEvent,
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
                            currentRelayEvent,
                            `student${num}`,
                            "idCard",
                            e.target.files[0]
                          )
                        }
                      />
                    </div>
                  ))}
                                    {isSubmitting && <p style={{ color: "blue" }}>Submitting... Please wait.</p>}
                                  <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={
                    isLocked ||
                    Object.values(urnErrors).some(
                      (error) => error && error.length > 0
                    ) || isSubmitting
                  }
                >
                   {isSubmitting ? "Submitting..." : "Submit & Next"}
                </button>
                                  <button className="skip-btn" onClick={goToNextUnlockedEvent}>
                  Skip & Next
                </button>

                </div>


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

export default Relay;
