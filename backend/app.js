const express = require('express');
const cors = require('cors')
require("dotenv").config()
const path = require('path');
const app = express();

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

//json middleware to extract to json data
app.use(express.json());

//user routes middleware
app.use("/api/users", userRoutes);
//question route middleware
app.use("/api/questions", questionRoute)
//answer route middleware
app.use("/api/answers", answerRoute)
//reply route middleware
app.use("/api/replies", replyRoute)

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
        await app.listen(port)
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
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
