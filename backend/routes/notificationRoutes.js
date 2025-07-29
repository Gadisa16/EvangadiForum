const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const auth = require('../middleware/authMiddleware');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    console.log('User:', req.user);
    const { limit = 20, offset = 0 } = req.query;
    const limitNum = Number.isNaN(parseInt(limit)) ? 20 : parseInt(limit);
    const offsetNum = Number.isNaN(parseInt(offset)) ? 0 : parseInt(offset);
    console.log('limit:', limitNum, 'offset:', offsetNum);
    const notifications = await NotificationService.getUserNotifications(
      req.user.userid,
      limitNum,
      offsetNum
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications!:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread notifications count
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.userid);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    await NotificationService.markAsRead(req.params.notificationId, req.user.userid);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.userid);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;