const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const RelayStudent = require("../models/RelayStudent");
const RelayLock = require("../models/RelayLock");


const router = express.Router();

// ✅ Authentication Middleware
const authMiddleware = (req, res, next) => {
  if (req.session.collegeName && req.session.username) {
    next();
  } else {
    console.log("Session Data:", req.session);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// ✅ Cloudinary Multer Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "relay_students",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// ✅ Upload fields for 4 students' ID Cards
const uploadFields = upload.fields([
  { name: "student1Image", maxCount: 1 },
  { name: "student2Image", maxCount: 1 },
  { name: "student3Image", maxCount: 1 },
  { name: "student4Image", maxCount: 1 },
]);

// ✅ GET Relay Event Lock Status
router.get("/relay-status/:event", authMiddleware, async (req, res) => {
  try {
    const { event } = req.params;
    const collegeName = req.session.collegeName;

    const lockDoc = await RelayLock.findOne({ collegeName });

    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.json({ status: "locked" });
    } else {
      return res.json({ status: "unlocked" });
    }
  } catch (error) {
    console.error("Error fetching lock status:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ✅ POST Register Relay Team (Single Team per Event)
router.post("/register", authMiddleware, uploadFields, async (req, res) => {
  try {
    console.log("REQ BODY ===>", req.body);
    console.log("REQ FILES ===>", req.files);

    const collegeName = req.session.collegeName;
    const event = req.body.relayEvent;

    if (!event || !collegeName) {
      return res.status(400).json({ success: false, message: "Missing event or college information" });
    }

    // Check if already registered
    const existingTeam = await RelayStudent.findOne({ collegeName, event });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: "You have already registered for this event." });
    }

    // Prepare students array
    const students = [];

    for (let i = 1; i <= 4; i++) {
      const student = {
        name: req.body[`student${i}Name`],
        urn: req.body[`student${i}URN`],
        gmail: req.body[`student${i}Gmail`],
        fatherName: req.body[`student${i}FatherName`],
        age: parseInt(req.body[`student${i}age`], 10),
        phoneNumber: req.body[`student${i}PhoneNumber`],
        image: req.files[`student${i}Image`]?.[0]?.path || "",
      };

      // Validation
      if (!student.name || !student.urn || !student.gmail || !student.fatherName || !student.age || !student.phoneNumber) {
        return res.status(400).json({ success: false, message: `All fields are required for student ${i}` });
      }

      students.push(student);
    }

    // Check lock (optional redundancy, just to be safe)
    let lockDoc = await RelayLock.findOne({ collegeName });

    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.status(403).json({ success: false, message: "You have already registered for this event." });
    }

    // Create RelayStudent document (without teamIndex)
    const relayTeam = new RelayStudent({
      collegeName,
      event,
      students,
    });

    await relayTeam.save();

    // Lock the event for the college
    if (!lockDoc) {
      await RelayLock.create({
        collegeName,
        eventsLocked: { [event]: true }
      });
    } else {
      lockDoc.eventsLocked[event] = true;
      await lockDoc.save();
    }

    res.status(201).json({ success: true, message: "Team registered successfully!" });

  } catch (error) {
    console.error("❌ Error registering relay team:", error);
    res.status(500).json({ success: false, message: "Server error, try again later!" });
  }
});

// ✅ GET Registered Teams for Logged-in College
router.get("/students", authMiddleware, async (req, res) => {
  try {
    const collegeName = req.session.collegeName;
    const { event } = req.query;

    const filter = { collegeName };
    if (event) filter.event = event;

    const teams = await RelayStudent.find(filter);

    res.json({ success: true, teams });
  } catch (error) {
    console.error("❌ Error fetching relay teams:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
