const dbconnection = require("../db/dbConfig");
const { StatusCodes } = require("http-status-codes");

async function postReply(req, res) {
    const { reply, answerid, userid } = req.body;

    if (!reply || !answerid || !userid) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ msg: "Please provide all required values." });
    }

    try {
        const [result] = await dbconnection.query(
            "INSERT INTO replies(userid, answerid, reply) VALUES(?,?,?)",
            [userid, answerid, reply]
        );
        return res
            .status(StatusCodes.CREATED)
            .json({ 
                msg: "Reply posted successfully",
                data: {
                    replyid: result.insertId,
                    reply,
                    userid,
                    answerid,
                    created_at: new Date()
                }
            });
    } catch (error) {
        console.log("reply posted error:", error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ msg: "Something went wrong try again later" });
    }
}

async function getReplies(req, res) {
    const answerId = req.params.answerId;
    const userId = req.user?.userid;

    if (!answerId) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ msg: "Please provide answer ID" });
    }

    try {
        const response = await dbconnection.query(
            `SELECT 
                r.replyid,
                r.reply,
                r.created_at,
                u.username,
                u.userid,
                COALESCE(SUM(CASE WHEN rv.vote_type = 'like' THEN 1 ELSE 0 END), 0) as likes,
                COALESCE(SUM(CASE WHEN rv.vote_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes,
                (SELECT vote_type FROM reply_votes WHERE reply_id = r.replyid AND user_id = ?) as user_vote
            FROM replies r
            INNER JOIN users u ON r.userid = u.userid
            LEFT JOIN reply_votes rv ON r.replyid = rv.reply_id
            WHERE r.answerid = ?
            GROUP BY r.replyid, r.reply, r.created_at, u.username, u.userid
            ORDER BY r.created_at ASC`,
            [userId || null, answerId]
        );
        return res.status(StatusCodes.OK).json({ data: response[0] });
    } catch (error) {
        console.log("Error fetching replies:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching replies" });
    }
}

async function handleReplyVote(req, res) {
    const { replyId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.userid;

    if (!replyId || !voteType || !userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Missing required parameters" });
    }

    try {
        // Check if user has already voted
        const [existingVote] = await dbconnection.query(
            "SELECT vote_type FROM reply_votes WHERE reply_id = ? AND user_id = ?",
            [replyId, userId]
        );

        if (existingVote.length > 0) {
            if (existingVote[0].vote_type === voteType) {
                // Remove vote if clicking same button
                await dbconnection.query(
                    "DELETE FROM reply_votes WHERE reply_id = ? AND user_id = ?",
                    [replyId, userId]
                );
                return res.json({ message: "Vote removed" });
            } else {
                // Update vote if changing vote type
                await dbconnection.query(
                    "UPDATE reply_votes SET vote_type = ? WHERE reply_id = ? AND user_id = ?",
                    [voteType, replyId, userId]
                );
            }
        } else {
            // Insert new vote
            await dbconnection.query(
                "INSERT INTO reply_votes (reply_id, user_id, vote_type) VALUES (?, ?, ?)",
                [replyId, userId, voteType]
            );
        }

        // Get updated vote counts
        const [votes] = await dbconnection.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END), 0) as likes,
                COALESCE(SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes
            FROM reply_votes 
            WHERE reply_id = ?`,
            [replyId]
        );

        // Get user's current vote
        const [userVote] = await dbconnection.query(
            "SELECT vote_type FROM reply_votes WHERE reply_id = ? AND user_id = ?",
            [replyId, userId]
        );

        return res.json({
            votes: votes[0],
            userVote: userVote[0]?.vote_type || null
        });
    } catch (error) {
        console.error("Error handling reply vote:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error processing vote" });
    }
}

async function updateReply(req, res) {
    const { replyid } = req.params;
    const { reply } = req.body;
    const userId = req.user.userid;

    try {
        // First check if the reply exists and belongs to the user
        const [existingReply] = await dbconnection.query(
            "SELECT * FROM replies WHERE replyid = ? AND userid = ?",
            [replyid, userId]
        );

        if (existingReply.length === 0) {
            return res.status(StatusCodes.FORBIDDEN).json({ 
                msg: "You don't have permission to edit this reply" 
            });
        }

        // Update the reply
        await dbconnection.query(
            "UPDATE replies SET reply = ? WHERE replyid = ?",
            [reply, replyid]
        );

        return res.status(StatusCodes.OK).json({ 
            msg: "Reply updated successfully" 
        });
    } catch (error) {
        console.error('Error updating reply:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            msg: "Something went wrong, try again later" 
        });
    }
}

module.exports = { postReply, getReplies, handleReplyVote, updateReply }; 