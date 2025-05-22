const express = require('express');
const router = express.Router();
const { upload, uploadImage } = require('../controller/uploadController');
const { verifyToken } = require('../middleware/auth');

// Route for image upload
router.post('/api/upload-image', verifyToken, upload.single('image'), uploadImage);

module.exports = router; 