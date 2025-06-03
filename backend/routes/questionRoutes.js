const express = require("express");
const router = express.Router();
const { postQuestion, allQuestions, getQuestionById, updateQuestion } = require("../controller/questionController.js");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.get("/all_questions", allQuestions);
router.get("/:questionid", getQuestionById);

// Protected routes
router.post("/post", authMiddleware, postQuestion);
router.put("/:questionid", authMiddleware, updateQuestion);

module.exports = router;