const dbconnection = require('./dbConfig');

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
`).then(() => {
  console.log('Notifications table created or already exists');
}).catch(err => {
  console.error('Error creating notifications table:', err);
}); 