const http = require('http');
const {google} = require('googleapis');
const fetch = require('node-fetch');
const url = require('url');
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'dailydb'
});

const CLIENT_ID = 'clientid';
const CLIENT_SECRET = 'clientsecret';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = 'refreshtoken';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});

let pendingRegistrations = {};

http.createServer(async (req, res) => {
    const requestURL = url.parse(req.url, true);

    if (requestURL.pathname === '/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const userData = JSON.parse(body);
            const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
            pendingRegistrations[userData.email] = otp;
            
            try {
                const gmail = google.gmail({version: 'v1', auth: oAuth2Client});
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
                res.writeHead(200);
                res.end('OTP sent');
            } catch (error) {
                res.writeHead(500);
                res.end('Error sending OTP');
            }
        });
    } else if (requestURL.pathname === '/create' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const userData = JSON.parse(body);
            
            if (pendingRegistrations[userData.email] == userData.otp) {
                delete pendingRegistrations[userData.email];
    
                // Remove the otp field from userData
                delete userData.otp;
                
                connection.query('INSERT INTO CUSTOMER SET ?', userData, (err, results) => {
                    if (err) {
                        console.error(err);  // Log the specific error
                        res.writeHead(500);
                        res.end('Error creating user: ' + err.message);  // Send the specific error message
                        return;
                    }
                    res.writeHead(200);
                    res.end('User created');
                });
            } else {
                res.writeHead(400);
                res.end('Invalid OTP');
            }
        });} // ... [the initial part of the code remains unchanged]

        else if (requestURL.pathname === '/login' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const { email, passcode } = JSON.parse(body);
        
                // Constructing the SQL query. Using placeholders (?) to prevent SQL injection.
                const query = 'SELECT * FROM CUSTOMER WHERE email = ? AND passcode = ?';
                connection.query(query, [email, passcode], (err, results) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error during login');
                        return;
                    }
        
                    if (results.length > 0) {  // Match found
                        res.writeHead(200);
                        res.end('Login successful');
                    } else {  // No match found
                        res.writeHead(400);
                        res.end('Invalid email or passcode');
                    }
                });
            });
        } 
        // ... [the rest of the code remains unchanged]
        
}).listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
