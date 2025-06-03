const express = require("express");
const router = express.Router();
const { postReply, getReplies, handleReplyVote, updateReply } = require("../controller/replyController");
const authMiddleware = require("../middleware/authMiddleware");

// Post a reply
router.post("/postreply", authMiddleware, postReply);

// Get all replies for an answer
router.get("/all-replies/:answerId", authMiddleware, getReplies);

// Handle reply voting
router.post("/:replyId/vote", authMiddleware, handleReplyVote);

// Update a reply
router.put("/:replyid", authMiddleware, updateReply);

module.exports = router; 