const express = require('express');
const app = express();

const cors = require('cors')
require("dotenv").config()
app.use(cors())

//db connection
const dbConnection = require('./db/dbConfig');

//user routes middleware file
const userRoutes = require('./routes/userRoutes');
const questionRoute = require('./routes/questionRoutes');
const answerRoute = require('./routes/answerRoutes');
const replyRoute = require('./routes/replyRoutes');
const authMiddleware = require('./middleware/authMiddleware');

//json middleware to extract to json data
app.use(express.json());

//user routes middleware
app.use("/api/users", userRoutes);
//question route middleware
app.use("/api/questions", authMiddleware, questionRoute)
//answer route middleware
app.use("/api/answers", authMiddleware, answerRoute)
//reply route middleware
app.use("/api/replies", authMiddleware, replyRoute)

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
