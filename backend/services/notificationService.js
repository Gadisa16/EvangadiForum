const dbconnection = require('../db/dbConfig');

class NotificationService {
  static async createNotification(userId, senderId, type, content, referenceId = null) {
    try {
      const [result] = await dbconnection.execute(
        'INSERT INTO notifications (user_id, sender_id, type, content, reference_id) VALUES (?, ?, ?, ?, ?)',
        [userId, senderId, type, content, referenceId]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // static async getUserNotifications(userId, limit = 20, offset = 0) {
  //   try {
  //     // Make sure limit and offset are numbers
  //     limit = Number(limit);
  //     offset = Number(offset);
  //     const [notifications] = await dbconnection.execute(
  //       `SELECT n.*, u.username as sender_username
  //        FROM notifications n
  //        LEFT JOIN users u ON n.user_id = u.userid
  //        WHERE n.user_id = ?
  //        ORDER BY n.created_at DESC
  //        LIMIT ? OFFSET ?`,
  //       [userId, limit, offset] //receiver_id == userId == n.user_id
  //     );
  //     return notifications;
  //   } catch (error) {
  //     console.error('Error fetching notifications!:', error);
  //     throw error;
  //   }
  // }

  static async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      // Make sure limit and offset are numbers
      userId = Number(userId);
      // limit = Number(limit);
      // offset = Number(offset);
      const [notifications] = await dbconnection.execute(
        `SELECT n.*, u.username as sender_username 
          FROM notifications n 
          LEFT JOIN users u ON n.sender_id = u.userid 
          WHERE n.user_id = ? 
          ORDER BY n.created_at DESC`,
        [userId]
      );
      console.log("notifications fetched",notifications);
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications!!:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const [result] = await dbconnection.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return result[0].count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      await dbconnection.execute(
        'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
        [notificationId, userId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      await dbconnection.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Specific notification types
  static async notifyNewAnswer(questionOwnerId, answererId, questionId, answerId) {
    const content = `answered your question`;
    return this.createNotification(questionOwnerId, answererId, 'answer', content, questionId);
  }

  static async notifyNewComment(userId, commenterId, referenceId) {
    const content = `commented on your post`;
    return this.createNotification(userId, commenterId, 'comment', content, referenceId);
  }

  static async notifyUpvote(userId, upvoterId, referenceId) {
    const content = `upvoted your post`;
    return this.createNotification(userId, upvoterId, 'upvote', content, referenceId);
  }

  static async notifyMention(userId, mentionerId, referenceId) {
    const content = `mentioned you in a post`;
    return this.createNotification(userId, mentionerId, 'mention', content, referenceId);
  }

  static async notifySystem(userId, content, referenceId = null) {
    return this.createNotification(userId, null, 'system', content, referenceId);
  }
}

module.exports = NotificationService; 