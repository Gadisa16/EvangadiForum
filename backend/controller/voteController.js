const dbConnection = require('../db/dbConfig');
const NotificationService = require('../services/notificationService');

// Vote on an answer
const voteAnswer = async (req, res) => {
    const { answerId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.userid;

    try {
        // Check if user has already voted
        const [existingVote] = await dbConnection.execute(
            'SELECT * FROM answer_votes WHERE answer_id = ? AND user_id = ?',
            [answerId, userId]
        );

        if (existingVote.length > 0) {
            // If same vote type, remove the vote
            if (existingVote[0].vote_type === voteType) {
                await dbConnection.execute(
                    'DELETE FROM answer_votes WHERE answer_id = ? AND user_id = ?',
                    [answerId, userId]
                );
                return res.status(200).json({ message: 'Vote removed' });
            }
            // If different vote type, update the vote
            await dbConnection.execute(
                'UPDATE answer_votes SET vote_type = ? WHERE answer_id = ? AND user_id = ?',
                [voteType, answerId, userId]
            );
        } else {
            // Insert new vote
            await dbConnection.execute(
                'INSERT INTO answer_votes (answer_id, user_id, vote_type) VALUES (?, ?, ?)',
                [answerId, userId, voteType]
            );
        }

        // Get updated vote counts
        const [votes] = await dbConnection.execute(
            `SELECT 
                SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as likes,
                SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislikes
            FROM answer_votes 
            WHERE answer_id = ?`,
            [answerId]
        );

        // Notify answer owner
        const [answerRows] = await dbConnection.execute(
            'SELECT userid FROM answers WHERE answerid = ?',
            [answerId]
        );
        if (answerRows.length > 0 && answerRows[0].userid !== userId) {
            await NotificationService.notifyUpvote(
                answerRows[0].userid, // answer owner
                userId, // voter
                answerId // referenceId
            );
        }

        res.status(200).json({
            message: 'Vote recorded successfully',
            votes: votes[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing vote' });
    }
};

// Get votes for an answer
const getVotes = async (req, res) => {
    const { answerId } = req.params;
    const userId = req.user.userid;

    try {
        // Get vote counts
        const [votes] = await dbConnection.execute(
            `SELECT 
                SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END) as likes,
                SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END) as dislikes
            FROM answer_votes 
            WHERE answer_id = ?`,
            [answerId]
        );

        // Get user's vote if any
        const [userVote] = await dbConnection.execute(
            'SELECT vote_type FROM answer_votes WHERE answer_id = ? AND user_id = ?',
            [answerId, userId]
        );

        res.status(200).json({
            votes: votes[0],
            userVote: userVote[0]?.vote_type || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching votes' });
    }
};

module.exports = {
    voteAnswer,
    getVotes
};