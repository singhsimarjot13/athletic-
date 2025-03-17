import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SportsApp.css";

function Relayfemale() {
  const [collegeName, setCollegeName] = useState("Loading...");
  const [relayData, setRelayData] = useState({});
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urnErrors, setUrnErrors] = useState({});

  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);


  const femaleRelayEvents = ["4x100m Relay Female", "4x400m Relay Female"];
  const relayEvents = femaleRelayEvents;
  const currentRelayEvent = relayEvents[currentEventIndex];
  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`${apiUrl}/user-info`, {
          withCredentials: true,
        });
        if (res.data.collegeName) {
          setCollegeName(res.data.collegeName);
        } else {
          navigate("/");
        }
      } catch (err) {
        console.log(err);
        navigate("/");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.get(`${apiUrl}/logout`, {
        withCredentials: true,
      });
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  const handleNavigation = (path) => {
    navigate(path);
  };
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
      const currentEventData = relayData[eventName] || {};
      const urnsInForm = Object.keys(currentEventData).map(
        (key) => key !== studentKey && currentEventData[key]?.urn
      ).filter(Boolean);

      const isDuplicateInForm = urnsInForm.includes(value);

      if (isDuplicateInForm) {
        setUrnErrors((prev) => ({
          ...prev,
          [studentKey]: `URN ${value} is duplicated within this form.`,
        }));
        return;
      }

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
      !student.phoneNumber
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
      alert("This event is locked. You cannot register again.");
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
      alert("One or more URNs are incorrect or duplicated. Please fix them before submitting.");
      return;
    }

    const currentRelayEvent = relayEvents[currentEventIndex];
    const eventData = relayData[currentRelayEvent] || {};

    for (let i = 1; i <= 4; i++) {
      const student = eventData[`student${i}`] || {};
      if (!validateFields(student)){      setIsSubmitting(false); return;}
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
      const response = await axios.post(
        `${apiUrl}/relay/register`,
        formData,
        {
          withCredentials: true,
        }
      );

      const result = response.data;

      if (result.success) {
        alert(result.message || "Relay Registration Successful!");
        setFormKey((prevKey) => prevKey + 1);
        window.scrollTo({ top: 0, behavior: "smooth" }); // ⬅️ Scroll to top
        goToNextUnlockedEvent();
      } else {
        alert(result.message || "Relay Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting relay data:", error);
      alert("Server error. Please try again later.");
    }
    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (currentEventIndex < relayEvents.length - 1) {
      setCurrentEventIndex((prevIndex) => prevIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" }); // ⬅️ Scroll to top
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="sports-app">
      <nav className="navbar">
        <div className="college-name">{collegeName}</div>
        <div className="nav-buttons">
        <button className="btn btn-primary" onClick={() => handleNavigation("/home")}>Dashboard</button>
          <button
            className="female-register-btn"
            onClick={() => navigate("/relayapp")}
          >
            Male Sports Register
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
                <div className="athlete-form"  key={formKey}>
                  {[1, 2, 3, 4].map((num) => {
                    const urnError = urnErrors[`student${num}`];
                    return (
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
                              e.target.value.trim()
                            )
                          }
                        />
                        {urnError && (
                          <div style={{ color: "red", fontSize: "12px" }}>
                            {urnError}
                          </div>
                        )}
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
                    );
                  })}
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
                                  <button className="skip-btn" onClick={handleNext}>
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

export default Relayfemale;
