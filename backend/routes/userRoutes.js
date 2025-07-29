const express = require('express');
const router = express.Router();
//authentication middleware
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

//user controller
const { register, login, check, updateProfile, getProfile, getUserStats } = require('../controller/userController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Public routes
router.post("/register", register)

//login route
router.post("/login", login)

//check user
router.get("/check", authMiddleware, check)

// Protected routes
router.put("/profile", authMiddleware, upload.single('profilePicture'), updateProfile)
router.get("/profile", authMiddleware, getProfile)
router.get("/stats", authMiddleware, getUserStats)

module.exports = router;