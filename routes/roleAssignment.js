const dotenv = require('dotenv');
dotenv.config();
const SECRET_KEY = process.env.JWT_Secret_key;

const jwt = require('jsonwebtoken');
const { connection } = require('../utils/database');

// Token Verification
const verifyToken = (req, res, callback) => {
    // The following line should be uncommented if you're planning to get the token from headers in the future.
    
    // const token = req.headers.authorization;
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBsb3llZU51bSI6Miwicm9sZSI6Im1hbmFnZXIiLCJ1c2VySUQiOiJtYW5hZ2VyMTIzIiwiaWF0IjoxNjk4OTk3MDEzLCJleHAiOjE2OTkwMDA2MTN9.dLtc7CPzNrTZdEWq7nGXWvYb9Qthh9sZ5O3qbtyrtqM"
    
    if (!token) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "No token provided!" }));
        return;
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Failed to authenticate token." }));
            return;
        }

        // Check if role is manager
        if (decoded.role !== 'manager') {
            console.log(decoded.role)
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Access denied. You're not authorized to view this data." }));
            return;
        }

        callback(null, decoded.userID);    // callback with null as the first parameter when there is no error and with an error object when there is an error.
    });
};

// Fetch Employee Details
const fetchEmployee = (req, res) => {
    connection.query('SELECT userName, userID, roleName FROM Employee', (error, employees) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Internal server error" }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(employees));
    });
};

const sendNotification = (userID, message, callback) => {
    const notificationType = "roleChange"; //defult is roleChange
    const query = 'INSERT INTO Notification (UserID, NotificationType, message, notificationDate, seen) VALUES (?, ?, ?, NOW(), ?)';
    const values = [userID, notificationType, message, false];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            return callback({ status: 500, message: "Internal server error" });
        }
        callback(null, results);
    });
};

const requestRoleChange = (req, res) => {
    const {userID, initiatingManagerID} = req.body;

    if (!userID) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User ID is required' }));
        return;
    }

    // Insert role change request into RoleChangeRequest table
    connection.query('INSERT INTO RoleChangeRequest (userID, numApproval, requestDate) VALUES (?, 1, CURDATE())', [userID], (error, results) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Internal server error" }));
            return;
        }

        // Update the Employee's roleStatus to 1 (1 means pending)
        connection.query('UPDATE Employee SET roleStatus = 1 WHERE userID = ?', [userID], (error, results) => {
            if (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Failed to update employee status" }));
                return;
            }

            // Fetch all manager IDs, excluding the initiating manager
            connection.query('SELECT userID FROM Employee WHERE roleName = "Manager" AND userID != ?', [initiatingManagerID], (error, managers) => {
                if (error) {
                    console.error(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Failed to fetch manager IDs" }));
                    return;
                }

                // For each manager, send a notification using the sendNotification function
                const message = `A role change has been requested for Employee with userID: ${userID}. Please review.`;
                let notificationsSent = 0;
                console.log(`num of managers: ${managers.length}`)
                for (let manager of managers) {
                    sendNotification(manager.userID, message, (error) => {
                        if (error) {
                            console.error(error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: "Failed to send notification" }));
                            return;
                        }
                        notificationsSent++;
                        if (notificationsSent === managers.length) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'Role change request successfully made, employee status updated, and notifications sent.' }));
                        }
                    });
                }
            });
        });
    });
};




module.exports = {
    verifyToken,
    fetchEmployee,
    requestRoleChange
};
