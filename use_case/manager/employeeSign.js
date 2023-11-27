const dotenv = require('dotenv');
dotenv.config();

const jwt = require('jsonwebtoken');
const { connection } = require('../../utils/database');

const SECRET_KEY = process.env.JWT_Secret_key;

const signUp = (req, res) => {
    const { userName, userID, pw } = req.body;
    
    connection.query('SELECT * FROM Employee WHERE userID = ?', [userID], (error, users) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Internal server error' }));
            return;
        }
        if (users.length > 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User already exists' }));
            return;
        }
        connection.query('INSERT INTO Employee (userName, roleName, roleStatus, dateAssigned, userID, pw) VALUES (?, ?, ?, ?, ?, ?)', 
        [userName, 'receptionist', 0, new Date().toISOString().slice(0, 10), userID, pw], (err) => {
            if (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Internal server error' }));
                return;
            }
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User registered successfully' }));
        });
    });
};

const signIn = (req, res) => {
    const { userID, pw } = req.body;
    
    connection.query('SELECT * FROM Employee WHERE userID = ?', [userID], (error, users) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Internal server error' }));
            return;
        }
        if (users.length === 0 || pw !== users[0].pw) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid credentials' }));
            return;
        }

        // generate token
        const token = jwt.sign({ 
            employeeNum: users[0].employeeNumber, 
            role: users[0].roleName,
            userID: users[0].userID
        }, SECRET_KEY, { expiresIn: '1h' });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
    });
};

module.exports = {
    signUp,
    signIn
};
