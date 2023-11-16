const dotenv = require('dotenv');
dotenv.config();
const SECRET_KEY = process.env.JWT_Secret_key;

const jwt = require('jsonwebtoken');
const { connection } = require('../../utils/database');

// Token Verification
const verifyToken = (req, res, callback) => {
    // The following line should be uncommented if you're planning to get the token from headers in the future.
    
    // const token = req.headers.authorization;
    // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBsb3llZU51bSI6Miwicm9sZSI6Im1hbmFnZXIiLCJ1c2VySUQiOiJtYW5hZ2VyMTIzIiwiaWF0IjoxNjk5MDQxMzgzLCJleHAiOjE2OTkwNDQ5ODN9.a9y5kUiWqeTwaPHAsITm0qmmPmQrMWJG-5BDuYwBdFc"
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    
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
    const {userID, toBeRole, initiatingManagerID} = req.body;

    if (!userID) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User ID is required' }));
        return;
    }

    connection.query('SELECT roleName FROM Employee WHERE userID = ?', [userID], (error, results) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Internal server error" }));
            return;
        } if (results.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "User not found" }));
            return;
        }
        const asIsRole = results[0].roleName;

        // Insert role change request into RoleChangeRequest table
        connection.query('INSERT INTO RoleChangeRequest (userID, numApproval, requestDate, asIsRole, toBeRole) VALUES (?, 1, CURDATE(), ?, ?)', [userID, asIsRole, toBeRole], (error, results) => {
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

    });
};


const fetchRoleChangeReqeust = (req, res) => {
    connection.query('SELECT userID, numApproval, asIsRole, toBeRole FROM RoleChangeRequest', (error, employees) => {
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


const approveRoleChangeRequest = (req, res) => {
    const userID = req.params.userID;

    if (!userID) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User ID is required' }));
        return;
    }

    connection.query('UPDATE RoleChangeRequest SET numApproval = numApproval + 1 WHERE userID = ?', [userID], (error, results) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Internal server error" }));
            return;
        }

        // Check if the number of approvals is 3
        connection.query('SELECT numApproval, toBeRole FROM RoleChangeRequest WHERE userID = ?', [userID], (error, results) => {
            if (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Internal server error" }));
                return;
            }

            if (results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Role change request not found for the given userID" }));
                return;
            }

            const approvals = results[0].numApproval;
            const newRole = results[0].toBeRole;

            if (approvals === 3) {
                connection.query('UPDATE Employee SET roleStatus = 0, roleName = ? WHERE userID = ?', [newRole, userID], (error) => {
                    if (error) {
                        console.error(error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: "Internal server error" }));
                        return;
                    }

                    connection.query('DELETE FROM RoleChangeRequest WHERE userID = ?', [userID], (error) => {
                        if (error) {
                            console.error(error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: "Internal server error" }));
                            return;
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: "Role change finalized and request deleted" }));
                    });
                });
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Role change request approved" }));
            }
        });
    });
};


const declineRoleChangeRequest = (req, res) => {
    const userID = req.params.userID;
    
    if (!userID) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User ID is required' }));
        return;
    }

    // Update the roleStatus to 0 in the Employee table
    connection.query('UPDATE Employee SET roleStatus = 0 WHERE userID = ?', [userID], (error, results) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Internal server error" }));
            return;
        }

        // Delete the request from RoleChangeRequest table
        connection.query('DELETE FROM RoleChangeRequest WHERE userID = ?', [userID], (error, results) => {
            if (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Internal server error" }));
                return;
            }

            // Check if any row was deleted
            if (results.affectedRows === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Invalid userID or no such request found" }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "Role change request declined and role status reset" }));
        });
    });
};

module.exports = {
    verifyToken,
    fetchEmployee,
    requestRoleChange,
    fetchRoleChangeReqeust,
    approveRoleChangeRequest,
    declineRoleChangeRequest
};

