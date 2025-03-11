const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Admin Login Route
router.post("/adminlogin", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    req.session.admin = true;
    req.session.allowSignup = false;

    return res.status(200).json({ success: true, token: "your_jwt_token" });
  }

  res.status(401).json({ error: "Invalid Admin Credentials" });
});

router.get("/admin-dashboard", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  res.json({ message: "Welcome to Admin Dashboard!" });
});

module.exports = router;
