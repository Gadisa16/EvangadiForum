const express = require('express')
const router = express.Router()
const {postAnswer, getAnswer, updateAnswer}= require('../controllers/answerController')
const {voteAnswer, getVotes} = require('../controllers/voteController')
const authMiddleware = require('../middleware/authMiddleware')

// Public routes
router.get("/all-answers/:questionId", getAnswer)

// Protected routes
router.post("/postanswers", authMiddleware, postAnswer)
router.put('/:answerid', authMiddleware, updateAnswer)
router.post('/:answerId/vote', authMiddleware, voteAnswer)
router.get('/:answerId/votes', authMiddleware, getVotes)

module.exports = router