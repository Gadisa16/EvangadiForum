const express = require("express");
const router = express.Router();
const { postQuestion, allQuestions } = require("../controller/questionController.js");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.get("/all_questions", allQuestions);

// Protected routes
router.post("/post", authMiddleware, postQuestion);

module.exports = router;