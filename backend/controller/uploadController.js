const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbConnection = require('../db/dbConfig');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Handle image upload
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, mimetype, size } = req.file;
    const userId = req.user.userid;
    const imageUrl = `/uploads/${filename}`;

    // Store image information in database
    await dbConnection.query(
      'INSERT INTO images (userid, filename, originalname, mimetype, size, url) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, filename, originalname, mimetype, size, imageUrl]
    );

    // Return the URL of the uploaded image
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    // If database insert fails, delete the uploaded file
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ error: 'Error uploading image' });
  }
};

// Get user's uploaded images
const getUserImages = async (req, res) => {
  try {
    const userId = req.user.userid;
    const [images] = await dbConnection.query(
      'SELECT * FROM images WHERE userid = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(images);
  } catch (error) {
    console.error('Error fetching user images:', error);
    res.status(500).json({ error: 'Error fetching images' });
  }
};

// Delete an image
const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user.userid;

    // Get image info before deleting
    const [images] = await dbConnection.query(
      'SELECT * FROM images WHERE imageid = ? AND userid = ?',
      [imageId, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = images[0];

    // Delete from database
    await dbConnection.query(
      'DELETE FROM images WHERE imageid = ? AND userid = ?',
      [imageId, userId]
    );

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', image.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Error deleting image' });
  }
};

module.exports = {
  upload,
  uploadImage,
  getUserImages,
  deleteImage
}; 