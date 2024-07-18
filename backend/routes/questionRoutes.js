const express = require("express");
const router = express.Router();
const { postQuestion, allQuestions } = require("../controller/questionController.js");

router.post("/post", postQuestion);
router.get("/all_questions", allQuestions);

module.exports = router;