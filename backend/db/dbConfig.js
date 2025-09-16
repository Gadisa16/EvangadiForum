const mysql2 = require('mysql2');

// Provide a fallback host if not defined (common local default)
const host = process.env.HOST || 'localhost';

// Create a standard pool
const pool = mysql2.createPool({
  host,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  connectionLimit: 10
});

// Create a promise-enabled pool wrapper
const db = pool.promise();

// Helper to run table creation sequentially with proper error handling
async function initSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS questions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      questionid VARCHAR(36) NOT NULL,
      userid INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      tag VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
      UNIQUE KEY unique_question (questionid)
    )`,
    `CREATE TABLE IF NOT EXISTS answers (
      answerid INT PRIMARY KEY AUTO_INCREMENT,
      userid INT NOT NULL,
      questionid VARCHAR(36) NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
      FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS answer_votes (
      vote_id INT PRIMARY KEY AUTO_INCREMENT,
      answer_id INT NOT NULL,
      user_id INT NOT NULL,
      vote_type ENUM('like', 'dislike') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (answer_id) REFERENCES answers(answerid) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
      UNIQUE KEY unique_vote (answer_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS replies (
      replyid INT PRIMARY KEY AUTO_INCREMENT,
      answerid INT NOT NULL,
      userid INT NOT NULL,
      reply_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (answerid) REFERENCES answers(answerid) ON DELETE CASCADE,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS reply_votes (
      vote_id INT PRIMARY KEY AUTO_INCREMENT,
      reply_id INT NOT NULL,
      user_id INT NOT NULL,
      vote_type ENUM('like', 'dislike') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reply_id) REFERENCES replies(replyid) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
      UNIQUE KEY unique_reply_vote (reply_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS images (
      imageid INT PRIMARY KEY AUTO_INCREMENT,
      userid INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      originalname VARCHAR(255) NOT NULL,
      mimetype VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      url VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
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
    )`
  ];

  for (const sql of statements) {
    try {
      await db.execute(sql);
    } catch (err) {
      console.error('Schema init error for statement:', sql.split('\n')[0], '\n', err.message);
      throw err;
    }
  }
}

// Kick off schema initialization (fire & forget with logging)
initSchema().then(() => {
  console.log('Database schema ensured');
}).catch(err => {
  console.error('Database schema initialization failed:', err.message);
});

module.exports = db;