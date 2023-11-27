const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const mysql = require('mysql2/promise');
const { generateToken } = require('../utils/authentication'); // Ensure this path is correct
require('dotenv').config();

const clientid = process.env.CLIENT_ID;
const clientsecret = process.env.CLIENT_SECRET;
const redirect = process.env.REDIRECT_URI;
const refresh = process.env.REFRESH_TOKEN;

const dbhost = process.env.DB_HOST;
const dbuser = process.env.DB_USER;
const dbpass = process.env.REFRESH_TOKEN;
const dbname = process.env.DB_PASS;

// Replace with your own configuration
const dbConfig = {
    host: dbhost,
    user: dbuser,
    password: dbpass,
    database: dbname
};

const CLIENT_ID = clientid
const CLIENT_SECRET = clientsecret
const REDIRECT_URI = redirect
const REFRESH_TOKEN = refresh

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

let pendingRegistrations = {};

// Create a MySQL connection pool (much better performance than single connection)
const pool = mysql.createPool(dbConfig);

router.post('/createCustomer', async (req, res) => {
    const userData = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    pendingRegistrations[userData.email] = otp;
    
        try {
            const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
            const raw = Buffer.from(
                `To: ${userData.email}\r\n` +
                'Subject: Your OTP for Registration\r\n' +
                'Content-Type: text/plain; charset=utf-8\r\n' +
                `\r\n${otp}`
            ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    
            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: raw
                }
            });
            res.status(200).send('OTP sent');
        } catch (error) {
            res.status(500).send('Error sending OTP');
        }
});


router.post('/checkOtp', async (req, res) => {
    const { otp, email } = req.body;
    if (pendingRegistrations[email] == otp) {
        delete pendingRegistrations[email];
        res.status(200).send('OTP verified');
    } else {
        res.status(400).send('Invalid OTP');
    }
});



router.post('/login', async (req, res) => {
    const { customerName, passcode, phoneNumber, email } = req.body;
    try {
        const connection = await pool.getConnection();

        // Check if the user exists
        let [users] = await connection.query('SELECT * FROM CUSTOMER WHERE email = ?', [email]);
        
        if (users.length > 0) {
            // User exists, check passcode
            const user = users[0];
            if (user.passcode === passcode) {
                // Passwords match, create a token
                
                const accessToken = generateToken({ customerNumber: user.customerNumber });
 // This line assumes that your generateToken function works correctly
                res.json({ accessToken }); // Send the access token in the response
            } else {
                res.status(403).send('Invalid passcode');
            }
        } else {
            // User does not exist, create new user
            await connection.query('INSERT INTO CUSTOMER (customerName, email, passcode, phoneNumber) VALUES (?, ?, ?, ?)', [customerName, email, passcode, phoneNumber]);
            // After creating the user, you also need to generate a token for them
            const accessToken = generateToken({ customerName, email });
            res.status(201).json({ accessToken }); // Send the access token for the new user
        }
        
        connection.release();
    } catch (err) {
        console.error(err.message); // Log the error for debugging
        res.status(500).send('Server error');
    }
});



module.exports = router;
