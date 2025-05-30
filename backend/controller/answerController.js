const dbconnection = require("../db/dbConfig");
const { StatusCodes } = require("http-status-codes");

async function postAnswer(req, res) {
    const { answer, questionid, userid } = req.body;

    if (!answer || !questionid || !userid) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Please provide all required value. " });
    }

    try {
        await dbconnection.query(
        "INSERT INTO answers(userid,questionid,answer) VALUES(?,?,?)",
        [userid, questionid, answer]
        );
        return res
        .status(StatusCodes.CREATED)
        .json({ msg: "Answer posted successfully" });
    } catch (error) {
        console.log("answer posted error is", error);
        return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Something went wrong try again later" });
    }
}
async function getAnswer(req, res) {
    const questionId = req.params.questionId;
    const userId = req.user?.userid; // Get userId if user is authenticated

    if (!questionId) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Please enter questionid " });
    }

    try {
        const response = await dbconnection.query(
            `SELECT 
                a.answerid,
                a.answer,
                a.created_at,
                u.username,
                u.userid,
                COALESCE(SUM(CASE WHEN av.vote_type = 'like' THEN 1 ELSE 0 END), 0) as likes,
                COALESCE(SUM(CASE WHEN av.vote_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes,
                (SELECT vote_type FROM answer_votes WHERE answer_id = a.answerid AND user_id = ?) as user_vote
            FROM answers a
            INNER JOIN users u ON a.userid = u.userid
            LEFT JOIN answer_votes av ON a.answerid = av.answer_id
            WHERE a.questionid = ?
            GROUP BY a.answerid, a.answer, a.created_at, u.username, u.userid
            ORDER BY a.answerid DESC`,
            [userId || null, questionId]
        );
        return res.status(StatusCodes.OK).json({ data: response[0] });
    } catch (error) {
        console.log("from get answer", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching answers" });
    }
}

module.exports = { postAnswer, getAnswer };