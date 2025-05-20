const mysql2 = require('mysql2');

const dbconnection = mysql2.createPool({
    host: 'localhost',
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    connectionLimit: 10
});

// dbconnection.execute("select 'test'", (err, result) => {
//     if (err) {
//         console.log(err.message);
//     } else {
//         console.log(result);
//     }
// });

// Create answer_votes table if it doesn't exist
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS answer_votes (
    vote_id INT PRIMARY KEY AUTO_INCREMENT,
    answer_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (answer_id) REFERENCES answers(answerid) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (answer_id, user_id)
  )
`);

module.exports = dbconnection.promise();