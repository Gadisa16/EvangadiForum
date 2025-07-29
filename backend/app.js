const express = require('express');
const cors = require('cors')
require("dotenv").config()
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');
const http = require('http');
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to other modules
app.set('io', io);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

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

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));

//db connection
const dbConnection = require('./db/dbConfig');

//user routes middleware file
const userRoutes = require('./routes/userRoutes');
const questionRoute = require('./routes/questionRoutes');
const answerRoute = require('./routes/answerRoutes');
const replyRoute = require('./routes/replyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

//json middleware to extract to json data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//user routes middleware
app.use("/api/users", userRoutes);
//question route middleware
app.use("/api/questions", questionRoute)
//answer route middleware
app.use("/api/answers", answerRoute)
//reply route middleware
app.use("/api/replies", replyRoute)
//notification route middleware
app.use("/api/notifications", notificationRoutes)

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Include upload routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/', uploadRoutes);

// const port = 3333;
const port = process.env.PORT || 3000;
async function start(){
    try {
        const result = await dbConnection.execute("select 'test'")
        await server.listen(port)
        console.log("database connection established")
        console.log(`listening on ${port}`)
    } catch (error) {
        console.log(error.message)
    }
}
start()

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ msg: "File size should be less than 5MB" });
    }
    return res.status(400).json({ msg: err.message });
  }
  res.status(500).json({ msg: "Something went wrong!" });
});

module.exports = app;
