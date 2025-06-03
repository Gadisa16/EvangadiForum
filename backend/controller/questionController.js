const dbconnection=require("../db/dbConfig.js")
const { StatusCodes } = require("http-status-codes");

async function postQuestion(req,res){

    const {tag,title,description,questionId,userId}=req.body
    
    if(!tag ||!title||!description){
        return res.status(StatusCodes.BAD_REQUEST).json({msg:"Please provide all required inputs"})
    }
    try {
        
        await dbconnection.query(
            "INSERT INTO questions(questionid,userid,title,description,tag) VALUES(?,?,?,?,?)",
            [questionId,userId,title,description,tag]
        );
        
        return res.status(StatusCodes.CREATED).json({ msg: "question posted successfully" });
    } catch (error) {
        console.log("posted",error)
                return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ msg: "Something went wrong try again later" });
    }
}

async function allQuestions(req, res) {
    try {
        const query = `
            SELECT q.questionid, q.title, q.description, q.id, q.created_at, u.username
            FROM questions q
            JOIN users u ON q.userid = u.userid
            ORDER BY q.id DESC;
        `;
        const result = await dbconnection.query(query);
        console.log("Database query result:", result[0]);
        return res.status(StatusCodes.OK).json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching question details with usernames:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Something went wrong, try again later" });
    }
}

async function getQuestionById(req, res) {
    const { questionid } = req.params;
    
    try {
        const query = `
            SELECT q.questionid, q.title, q.description, q.id, q.created_at, q.userid, u.username
            FROM questions q
            JOIN users u ON q.userid = u.userid
            WHERE q.questionid = ?
        `;
        const result = await dbconnection.query(query, [questionid]);
        
        if (result[0].length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "Question not found" });
        }

        return res.status(StatusCodes.OK).json({ data: result[0][0] });
    } catch (error) {
        console.error('Error fetching question:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Something went wrong, try again later" });
    }
}

async function updateQuestion(req, res) {
    const { questionid } = req.params;
    const { description } = req.body;
    
    if (!description) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide the updated content" });
    }

    try {
        await dbconnection.query(
            "UPDATE questions SET description = ? WHERE questionid = ?",
            [description, questionid]
        );
        
        return res.status(StatusCodes.OK).json({ msg: "Question updated successfully" });
    } catch (error) {
        console.error('Error updating question:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Something went wrong, try again later" });
    }
}

module.exports = {  postQuestion, allQuestions, getQuestionById, updateQuestion };