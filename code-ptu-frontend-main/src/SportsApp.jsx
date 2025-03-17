import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SportsApp.css";
import axios from "axios";


function SportsApp() {
  const [collegeName, setCollegeName] = useState("Loading...");
  const [athleteData, setAthleteData] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [urnWarnings, setUrnWarnings] = useState({});
  const [urnMatchWarning, setUrnMatchWarning] = useState("");
  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetForm = () => {
    setAthleteData((prev) => ({
        ...prev,
        [events[currentEventIndex]]: { student1: {}, student2: {} }
    }));

    setUrnWarnings({});
    
    // Change the form key to force a re-render
    setFormKey((prevKey) => prevKey + 1);
};
const handleNavigation = (path) => {
  navigate(path);
};


const apiUrl = import.meta.env.VITE_API_URL;




  const maleEvents = [
    "100M Race-Male",
    "200M Race-Male",
    "400M Race-Male",
    "800M Race-Male",
    "1500M Race-Male",
    "5000M Race-Male",
    "10000M Race-Male",
    "110M Hurdles-Male",
    "400M Hurdles-Male",
  ];

  const events = maleEvents;
  const currentEvent = events[currentEventIndex];

  // Fetch college info on mount
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

  // Move to the next unlocked event
  const goToNextUnlockedEvent = async () => {

    let nextIndex = currentEventIndex + 1;

    while (nextIndex < events.length) {
      const event = events[nextIndex];
      try {
        const res = await axios.get(
          `${apiUrl}/student/event-status/${event}`,
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

  // Check lock status for current event
  useEffect(() => {
    if (!currentEvent) {
      setIsSubmitted(true);
      return;
    }

    const checkCurrentEventLock = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/student/event-status/${currentEvent}`,
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

  const handleLogout = async () => {
    await fetch(`${apiUrl}/logout`, { credentials: "include" });
    navigate("/");
  };

  const checkURNRegistrationLimit = async (urn, studentKey) => {
    if (!urn) {
      setUrnWarnings((prev) => ({
        ...prev,
        [`${currentEvent}_${studentKey}`]: "",
      }));
      return;
    }

    try {
      const res = await axios.get(
        `${apiUrl}/student/registration-count/${urn}`,
        { withCredentials: true }
      );
      const count = res.data.count;

      if (count >= 2) {
        setUrnWarnings((prev) => ({
          ...prev,
          [`${currentEvent}_${studentKey}`]: `URN ${urn} already registered in ${count} events.`,
        }));
      } else {
        setUrnWarnings((prev) => ({
          ...prev,
          [`${currentEvent}_${studentKey}`]: "",
        }));
      }
    } catch (err) {
      console.error("Error fetching registration count:", err);
    }
  };

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

    if (field === "urn") {
      checkURNRegistrationLimit(value, studentKey);
    }

    // Real-time URN matching check
    const updatedData = {
      ...athleteData,
      [eventName]: {
        ...athleteData[eventName],
        [studentKey]: {
          ...athleteData[eventName]?.[studentKey],
          [field]: value,
        },
      },
    };

    const urn1 = updatedData[eventName]?.student1?.urn;
    const urn2 = updatedData[eventName]?.student2?.urn;

    if (urn1 && urn2 && urn1 === urn2) {
      setUrnMatchWarning("Student 1 and Student 2 cannot have the same URN.");
      isSubmitting(false);
    } else {
      setUrnMatchWarning("");
    }
  };

  const validateFields = async (student) => {
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
      isSubmitting(false);
      return false;
    }
    if (!phoneRegex.test(student.phoneNumber)) {
      alert("Invalid phone number. Must be 10 digits starting with 6-9.");
      isSubmitting(false);
      return false;
    }
    if (age > 25) {
      alert("Student age must be 25 or below.");
      isSubmitting(false);
      return false;
    }

    const res = await axios.get(
      `${apiUrl}/student/registration-count/${student.urn}`,
      { withCredentials: true }
    );

    const count = res.data.count;

    if (count >= 2) {
      alert(
        `Student with URN ${student.urn} is already registered in ${count} events. Cannot register in more events.`
      );
      return false;
    }

    return true;
  };

  const isStudentFilled = (student) => {
    return (
      student.name ||
      student.urn ||
      student.gmail ||
      student.fatherName ||
      student.dob ||
      student.phoneNumber ||
      student.idCard
    );
  };

  const handleSubmit = async () => {
    if (isLocked) {
      alert("This event is locked. Moving to the next event...");
      setTimeout(() => {
        resetForm();

        goToNextUnlockedEvent();
      }, 2000);
      return;
    }
    setIsSubmitting(true); // ⬅️ Start Loading
    const currentEvent = events[currentEventIndex];
    const student1 = athleteData[currentEvent]?.student1 || {};
    const student2 = athleteData[currentEvent]?.student2 || {};
try{
    // Final URN check before submission
    if (student1.urn && student2.urn && student1.urn === student2.urn) {
      alert("Student 1 and Student 2 cannot have the same URN.");
      setIsSubmitting(false);
      return;
    }

    if (!(await validateFields(student1))){setIsSubmitting(false); return;}

    if (isStudentFilled(student2)) {
      if (!(await validateFields(student2))){setIsSubmitting(false);return;} 
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
    formData.append("events", currentEvent);

    formData.append("student1Name", student1.name);
    formData.append("student1URN", student1.urn);
    formData.append("student1Gmail", student1.gmail);
    formData.append("student1FatherName", student1.fatherName);
    formData.append("student1age", calculateAge(student1.dob));
    formData.append("student1PhoneNumber", student1.phoneNumber);
    if (student1.idCard) {
      formData.append("student1Image", student1.idCard);
    }

    if (isStudentFilled(student2)) {
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

      const response = await fetch(`${apiUrl}/student/register`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || "Registration Successful!");
        resetForm();

        handleNext();
      } else {
        alert(result.message || "Registration failed. Please try again.");
        isSubmitting(false);
      }
    } catch (error) {
      console.error("Error:", error);
      console.log("Server error. Please try again later.");
    }finally{
    setIsSubmitting(false);}
  };

  const handleNext = () => {
    if (currentEventIndex < events.length - 1) {
      resetForm();
      setTimeout(() => {
        setCurrentEventIndex((prevIndex) => prevIndex + 1);
        window.scrollTo({ top: 0, behavior: "smooth" }); // ⬅️ Scroll to top
    }, 500); 
      
    } else {
      setIsSubmitted(true);
    }
  };

  const submitDisabled = urnMatchWarning || isLocked;

  return (
  

    <div className="sports-app">
      <nav className="navbar">
        <div className="college-name">{collegeName}</div>
        <div className="nav-buttons">
              <button className="btn btn-primary" onClick={() => handleNavigation("/home")}>Dashboard</button>
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

            {urnMatchWarning && (
              <p style={{ color: "red" }}>{urnMatchWarning}</p>
            )}

            {!isLocked && (
              <>
                <div className="athlete-form" key={formKey}>
                  <h4>Student 1</h4>
                  <input
                    type="text"
                    placeholder="Name"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "name", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="URN"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "urn", e.target.value)
                    }
                  />
                  {urnWarnings[`${currentEvent}_student1`] && (
                    <p style={{ color: "red" }}>{urnWarnings[`${currentEvent}_student1`]}</p>
                  )}
                  <input
                    type="email"
                    placeholder="Gmail"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "gmail", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Father's Name"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "fatherName", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    placeholder="Date Of Birth"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "dob", e.target.value)
                    }
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "phoneNumber", e.target.value)
                    }
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student1", "idCard", e.target.files[0])
                    }
                  />

                  <h4>Student 2 (Optional)</h4>
                  <input
                    type="text"
                    placeholder="Name"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="URN"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "urn", e.target.value)
                    }
                  />
                  {urnWarnings[`${currentEvent}_student2`] && (
                    <p style={{ color: "red" }}>{urnWarnings[`${currentEvent}_student2`]}</p>
                  )}
                  <input
                    type="email"
                    placeholder="Gmail"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "gmail", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Father's Name"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "fatherName", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    placeholder="Date Of Birth"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "dob", e.target.value)
                    }
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "phoneNumber", e.target.value)
                    }
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleInputChange(currentEvent, "student2", "idCard", e.target.files[0])
                    }
                  />
                  {isSubmitting && <p style={{ color: "blue" }}>Submitting... Please wait.</p>}

<button className="submit-btn" onClick={handleSubmit} disabled={submitDisabled || isSubmitting}>
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
          <h2>Thank you for registering!</h2>
        )}
      </div>
    </div>
  );
}

export default SportsApp;
