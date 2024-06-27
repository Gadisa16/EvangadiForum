const dbConnection = require('../db/dbConfig')
const { StatusCodes } = require('http-status-codes');

async function postAnswer(req,res){
    const {userid,questionid,answer}=req.body;
    if(!questionid || !userid || !answer){
        return res.status(StatusCodes.BAD_REQUEST).json({msg:"please provide all required fields"})
    }
    //insert data into answers table
    try {
        await dbConnection.query("INSERT INTO answers (userid,questionid,answer) VALUES (?,?,?)",[userid,questionid,answer])
        return res.status(StatusCodes.CREATED).json({msg:"answer posted"})
        
    } catch (error) {
        console.log(error.message)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:"something went wrong, try again later"})
    }

}
async function allAnswer(req,res){
    // const questionid = req.query.questionid;
    
    const questionId = req.headers['questionid'];
    // console.log(questionId)
        try {
            const [allanswer] = await dbConnection.query(`SELECT users.username, answers.answer
            FROM answers
            JOIN users ON answers.userid = users.userid
            WHERE answers.questionid = ?
            `,[questionId])
                return res.status(StatusCodes.OK).json({msg:"all answer retrieved succesfully",allanswer})
        
        } catch (error) {
            console.log(error.message)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:"something went wrong, try again later"})
        }
    
}

module.exports = {postAnswer,allAnswer};