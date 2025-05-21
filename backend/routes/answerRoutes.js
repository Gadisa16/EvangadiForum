const express = require('express')
const router = express.Router()
const {postAnswer, getAnswer}= require('../controller/answerController')
const {voteAnswer, getVotes} = require('../controller/voteController')
const authMiddleware = require('../middleware/authMiddleware')

// Public routes
router.get("/all-answers/:questionId", getAnswer)

// Protected routes
router.post("/postanswers", authMiddleware, postAnswer)
router.post('/:answerId/vote', authMiddleware, voteAnswer)
router.get('/:answerId/votes', authMiddleware, getVotes)

module.exports = router