const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const Student = require("../models/Student");
const RelayStudent = require("../models/RelayStudent");
const MaleEventLock = require("../models/eventLock");

const router = express.Router();
const authMiddleware = (req, res, next) => {
  if (req.session.collegeName && req.session.username) {
    next();
  } else {
    console.log("Session Data:", req.session);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
router.get("/event-status/:event", authMiddleware, async (req, res) => {
  try {
    const { event } = req.params;
    const collegeName = req.session.collegeName;

    const lockDoc = await MaleEventLock.findOne({ collegeName });

    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.json({ status: "locked" });
    } else {
      return res.json({ status: "unlocked" });
    }
  } catch (error) {
    console.error("❌ Error fetching event lock status:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

router.get("/students", async (req, res) => {
  try {
    const { event, collegeName } = req.query;
    let filter = {};

    // Filter by event
    if (event) {
      filter.event = event;
    }

    // Filter by college name (Top-Level Field)
    if (collegeName) {
      filter.collegeName = { $regex: collegeName, $options: "i" }; // Case-insensitive search
    }

    console.log("Filter Query:", filter); // Debugging

    const students = await Student.find(filter);

    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


router.get("/export", async (req, res) => {
  try {
    const { event, collegeName } = req.query;

    let query = {};
    if (event) query.event = event;
    if (collegeName) query.collegeName = collegeName;

    // Fetch data from both collections
    const students = await Student.find(query);
    const relayStudents = await RelayStudent.find(query);

    console.log("Students Data:", students);
    console.log("Relay Students Data:", relayStudents);

    const allStudents = [
      ...students.map((entry) => ({
        College: entry.collegeName || "",
        Event: entry.event || "",
        Student1_Name: entry.students?.student1?.name || "",
        Student1_URN: entry.students?.student1?.urn || "",
        Student1_Email: entry.students?.student1?.gmail || "",
        Student2_Name: entry.students?.student2?.name || "",
        Student2_URN: entry.students?.student2?.urn || "",
        Student2_Email: entry.students?.student2?.gmail || "",
      })),
      ...relayStudents.flatMap((entry) =>
        entry.students.map((student, index) => ({
          College: entry.collegeName || "",
          Event: entry.event || "",
          Team: entry.teamIndex || "",
          Student_Index: index + 1,
          Student_Name: student.name || "",
          Student_URN: student.urn || "",
          Student_Email: student.gmail || "",
        }))
      ),
    ];

    console.log("Formatted Data for Excel:", allStudents);

    if (allStudents.length === 0) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    // Convert JSON to Excel
    const ws = XLSX.utils.json_to_sheet(allStudents);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    // Convert workbook to buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    // Set response headers
    res.setHeader("Content-Disposition", 'attachment; filename="students_data.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    res.send(buffer);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});






// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "student_images",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "student1Image", maxCount: 1 },
  { name: "student2Image", maxCount: 1 },
]);

router.post("/register", authMiddleware, uploadFields, async (req, res) => {
  try {
    const collegeName = req.session.collegeName; // 🎯 Use session collegeName for consistency
    const {
      events,
      student1Name, student1URN, student1Gmail, student1FatherName, student1age, student1PhoneNumber,
      student2Name, student2URN, student2Gmail, student2FatherName, student2age, student2PhoneNumber
    } = req.body;

    const event = events; // Rename for clarity

    // 🔐 Check if the event is already locked for this college
    let lockDoc = await MaleEventLock.findOne({ collegeName });
    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.status(403).json({ success: false, message: "Event is already locked for this college." });
    }

    // Check if already registered
    const existingEntry = await Student.findOne({ collegeName, event });
    if (existingEntry) {
      return res.status(400).json({ success: false, message: "Already registered for this event." });
    }

    const student1Image = req.files?.student1Image?.[0]?.path || "";
    const student2Image = req.files?.student2Image?.[0]?.path || "";

    const newStudent = new Student({
      collegeName,
      event,
      students: {
        student1: {
          name: student1Name,
          urn: student1URN,
          gmail: student1Gmail,
          fatherName: student1FatherName,
          age: student1age,
          phoneNumber: student1PhoneNumber,
          image: student1Image,
        },
      },
    });

    if (student2URN) {
      newStudent.students.student2 = {
        name: student2Name,
        urn: student2URN,
        gmail: student2Gmail,
        fatherName: student2FatherName,
        age: student2age,
        phoneNumber: student2PhoneNumber,
        image: student2Image,
      };
    }

    await newStudent.save();

    // 🔐 Lock the event after successful registration
    if (!lockDoc) {
      await MaleEventLock.create({
        collegeName,
        eventsLocked: { [event]: true },
      });
    } else {
      lockDoc.eventsLocked[event] = true;
      await lockDoc.save();
    }

    res.json({ success: true, message: "Student registered and event locked successfully!" });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


module.exports = router;
