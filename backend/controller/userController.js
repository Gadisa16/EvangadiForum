const dbConnection = require('../db/dbConfig');
const bcrypt = require('bcrypt');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

async function register(req, res) {
    const { username, firstname, lastname, email, password } = req.body;

    if (!username || !firstname || !lastname || !email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "please provide all required fields" });
    }

    try {
        const [user] = await dbConnection.query("SELECT username, userid FROM users WHERE username = ? OR email = ?", [username, email]);

        if (user.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "user already registered" });
        }

        if (password.length < 8) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "password must be at least 8 characters" });
        }

        // Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await dbConnection.query("INSERT INTO users (username, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)", [username, firstname, lastname, email, hashedPassword]);

        return res.status(StatusCodes.CREATED).json({ msg: "user created" });

    } catch (error) {
        console.error(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "something went wrong, try again later" });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "please provide all required fields" });
    }

    try {
        const [user] = await dbConnection.query("SELECT username, userid, password FROM users WHERE email = ?", [email]);

        // Check if the credentials are valid
        if (user.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credential" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credential" });
        }

        const username = user[0].username;
        const userid = user[0].userid;
        const token = jwt.sign({ username, userid }, process.env.JWT_SECRET, { expiresIn: "2d" });

        return res.status(StatusCodes.OK).json({ msg: "user login successful", token, username });

    } catch (error) {
        console.error(error.message);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "something went wrong, try again later" });
    }
}

async function check(req, res) {
    const username = req.user.username;
    const userid = req.user.userid;
    res.status(StatusCodes.OK).json({ msg: "valid user", username, userid });
}

async function updateProfile(req, res) {
    const { username, email, bio, firstname, lastname } = req.body;
    const userId = req.user.userid;
    const profilePicture = req.file;

    try {
        // Check if email is already taken by another user
        if (email) {
            const [existingUser] = await dbConnection.query(
                "SELECT * FROM users WHERE email = ? AND userid != ?",
                [email, userId]
            );

            if (existingUser.length > 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email already in use" });
            }
        }

        let profilePicturePath = null;
        if (profilePicture) {
            profilePicturePath = `/uploads/${profilePicture.filename}`;
        }

        // Update user profile
        const [result] = await dbConnection.query(
            `UPDATE users 
             SET username = COALESCE(?, username),
                 email = COALESCE(?, email),
                 bio = COALESCE(?, bio),
                 firstname = COALESCE(?, firstname),
                 lastname = COALESCE(?, lastname),
                 profilePicture = COALESCE(?, profilePicture)
             WHERE userid = ?`,
            [username, email, bio, firstname, lastname, profilePicturePath, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
        }

        // Get updated user data
        const [users] = await dbConnection.query(
            "SELECT userid, username, email, firstname, lastname, profilePicture, bio FROM users WHERE userid = ?",
            [userId]
        );

        res.json({
            msg: "Profile updated successfully",
            user: {
                userId: users[0].userid,
                username: users[0].username,
                email: users[0].email,
                firstname: users[0].firstname,
                lastname: users[0].lastname,
                profilePicture: users[0].profilePicture,
                bio: users[0].bio
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Server error" });
    }
}

async function getProfile(req, res) {
    try {
        const [users] = await dbConnection.query(
            "SELECT userid, username, email, firstname, lastname, profilePicture, bio FROM users WHERE userid = ?",
            [req.user.userid]
        );

        if (users.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
        }

        const user = users[0];
        res.json({
            userId: user.userid,
            username: user.username,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            profilePicture: user.profilePicture,
            bio: user.bio
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Server error" });
    }
}

async function getUserStats(req, res) {
    try {
        const userId = req.user.userid;

        // Get questions count
        const [questions] = await dbConnection.query(
            "SELECT COUNT(*) as count FROM questions WHERE userid = ?",
            [userId]
        );

        // Get answers count
        const [answers] = await dbConnection.query(
            "SELECT COUNT(*) as count FROM answers WHERE userid = ?",
            [userId]
        );

        // Get user profile completion
        const [user] = await dbConnection.query(
            "SELECT username, email, firstname, lastname, profilePicture, bio FROM users WHERE userid = ?",
            [userId]
        );

        if (user.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
        }

        // Calculate profile completion
        const profileFields = ['username', 'email', 'firstname', 'lastname', 'profilePicture', 'bio'];
        const filledFields = profileFields.filter(field => user[0][field] !== null && user[0][field] !== '');
        const profileCompletion = Math.round((filledFields.length / profileFields.length) * 100);

        // Calculate activity score (weighted sum of questions and answers)
        const activityScore = (questions[0].count * 10) + (answers[0].count * 5);

        res.json({
            questionsCount: questions[0].count,
            answersCount: answers[0].count,
            profileCompletion,
            activityScore
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Server error" });
    }
}

module.exports = { register, login, check, updateProfile, getProfile, getUserStats };