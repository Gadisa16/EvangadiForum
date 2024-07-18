const express = require('express')
const router = express.Router()
const {postAnswer, getAnswer}= require('../controller/answerController')


router.post("/postanswers", postAnswer)

router.get("/all-answers/:questionId", getAnswer)

module.exports = router