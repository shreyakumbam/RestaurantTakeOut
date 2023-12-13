const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const { generateToken, authenticateToken } = require('../../utils/authentication');

const app = express();
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_Name,
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + db.threadId);
});

app.use(bodyParser.json());

// Add this code in your login route just before sending the response
// app.post('/login', (req, res) => {
//     const { username, password } = req.body;

//     // You would validate the username and password against your user database.
//     // For simplicity, let's assume valid credentials for now.
//     // Also, allow any JSON values for username and password
//     if (username && password) {
//         // Generate a JWT token
//         const user = { username }; // You can include more user data if needed
//         const token = generateToken(user);

//         // Log the token and response before sending
//         console.log('Token:', token);
//         res.json({ token });
//     } else {
//         res.status(401).json({ error: 'Invalid credentials' });
//     }
// });

app.post('/inquiry', authenticateToken, (req, res) => {
    try {
        const { customerNumber, feedbackText } = req.body;

        const query = 'INSERT INTO feedback (customerNumber, feedbackText) VALUES (?, ?)';
        db.query(query, [customerNumber, feedbackText], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(200).json({ message: 'Inquiry submitted successfully' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid JSON data' });
    }
});

app.get('/inquiries', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM feedback';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const inquiries = results.map((row) => ({
                customerNumber: row.customerNumber,
                feedbackText: row.feedbackText,
            }));
            res.status(200).json(inquiries);
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const port = process.env.PORT || 3004;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});