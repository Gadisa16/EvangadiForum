const mysql2 = require('mysql2');

const dbconnection = mysql2.createPool({
    host: process.env.HOST,
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

// Create questions table if it doesn't exist
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    questionid VARCHAR(36) NOT NULL,
    userid INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    UNIQUE KEY unique_question (questionid)
  )
`);

// Create answers table if it doesn't exist
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS answers (
    answerid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT NOT NULL,
    questionid VARCHAR(36) NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE
  )
`);

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

// Create replies table if it doesn't exist
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS replies (
    replyid INT PRIMARY KEY AUTO_INCREMENT,
    answerid INT NOT NULL,
    userid INT NOT NULL,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
  )
`);

// Create reply_votes table if it doesn't exist
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS reply_votes (
    vote_id INT PRIMARY KEY AUTO_INCREMENT,
    reply_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reply_id) REFERENCES replies(replyid) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    UNIQUE KEY unique_reply_vote (reply_id, user_id)
  )
`);

// Create images table if it doesn't exist
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS images (
    imageid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    originalname VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
  )
`);

// Create notifications table
dbconnection.execute(`
  CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    sender_id INT,
    type ENUM('answer', 'comment', 'upvote', 'mention', 'system') NOT NULL,
    content TEXT NOT NULL,
    reference_id VARCHAR(36),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(userid) ON DELETE SET NULL
  )
`);

module.exports = dbconnection.promise();