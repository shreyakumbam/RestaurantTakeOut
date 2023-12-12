const jwt = require('jsonwebtoken');

require('dotenv').config();

const secretk = process.env.secretKey;


const secretKey = secretk;



const mysql = require('mysql2/promise');




const dbhost = process.env.DB_HOST;
const dbuser = process.env.DB_USER;
const dbpass = process.env.DB_PASS;
const dbname = process.env.DB_Name;

// Replace with your own configuration
const dbConfig = {
    host: dbhost,
    user: dbuser,
    password: dbpass,
    database: dbname
};


// Create a MySQL connection pool (much better performance than single connection)
const connection = mysql.createPool(dbConfig);


function generateToken(user) {
    return jwt.sign(user, secretKey, { expiresIn: '1h' });
}

// function authenticateToken(req, res, next) {
//     // Get auth header value
//     const bearerHeader = req.headers['authorization'];
//     if (typeof bearerHeader !== 'undefined') {
//         // Split at the space
//         const bearer = bearerHeader.split(' ');
//         // Get token from array
//         const bearerToken = bearer[1];
//         // Verify the token
//         jwt.verify(bearerToken, secretKey, (err, user) => {
//             console.log(user); 
//             if (err) {
//                 // If token is invalid or expired
//                 return res.sendStatus(403);
//             }
//             // If token is valid, save to request for use in other routes
//             req.user = user;
//             next();
//         });
//     } else {
//         // If bearer header is undefined (no token), return 401 Unauthorized
//         res.sendStatus(401);
//     }
// }


function authenticateToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Verify the token
        jwt.verify(bearerToken, secretKey, (err, user) => {
            console.log(user); 
            if (err) {
                // If token is invalid or expired
                return res.sendStatus(403);
            }
            connection.query('SELECT current_token FROM `CUSTOMER` WHERE customerNumber = ?', [user.customerNumber])
    .then(([users]) => {
        if (users.length > 0 && users[0].current_token === bearerToken) {
            req.user = user;
            next();
        } else {
            res.sendStatus(403);
        }
    })
    .catch(error => {
        console.error(error.message);
        res.status(500).send('Server error');
    });
        });
    } else {
        // If bearer header is undefined (no token), return 401 Unauthorized
        res.sendStatus(401);
    }
}


module.exports = { generateToken, authenticateToken };
