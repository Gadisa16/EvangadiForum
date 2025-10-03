const multer = require('multer');
const path = require('path');
const dbConnection = require('../db/dbConfig');
const { supabase } = require('../utils/supabaseClient');

// Configure multer for image upload (memory storage for Supabase upload)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Handle image upload
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!supabase) {
      return res.status(500).json({ error: 'Storage not configured. Contact admin.' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user.userid;
    const ext = path.extname(originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const objectPath = `${userId}/${filename}`; // per-user folder

    // Ensure bucket exists in Supabase: create a bucket named 'images' (public) in dashboard
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(objectPath, buffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get a public URL (requires bucket to be set as public)
    const { data } = supabase.storage.from('images').getPublicUrl(objectPath);
    const imageUrl = data?.publicUrl;

    // Store image information in database
    await dbConnection.query(
      'INSERT INTO images (userid, filename, originalname, mimetype, size, url) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, filename, originalname, mimetype, size, imageUrl]
    );

    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
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

    const [images] = await dbConnection.query(
      'SELECT * FROM images WHERE imageid = ? AND userid = ?',
      [imageId, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = images[0];

    // Remove from storage (best-effort)
    if (supabase) {
      const objectPath = `${userId}/${image.filename}`;
      const { error: removeErr } = await supabase.storage.from('images').remove([objectPath]);
      if (removeErr) console.warn('Supabase remove error:', removeErr.message);
    }

    // Delete DB record
    await dbConnection.query(
      'DELETE FROM images WHERE imageid = ? AND userid = ?',
      [imageId, userId]
    );

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