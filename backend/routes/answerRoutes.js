const express = require('express')
const router = express.Router()
const {postAnswer, getAnswer}= require('../controller/answerController')
const {voteAnswer, getVotes} = require('../controller/voteController')


router.post("/postanswers", postAnswer)

router.get("/all-answers/:questionId", getAnswer)

// Vote routes
router.post('/:answerId/vote', voteAnswer)
router.get('/:answerId/votes', getVotes)

module.exports = router