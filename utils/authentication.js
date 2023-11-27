const jwt = require('jsonwebtoken');

require('dotenv').config();

const secretk = process.env.secretKey;


const secretKey = secretk;

function generateToken(user) {
    return jwt.sign(user, secretKey, { expiresIn: '1h' });
}

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
            // If token is valid, save to request for use in other routes
            req.user = user;
            next();
        });
    } else {
        // If bearer header is undefined (no token), return 401 Unauthorized
        res.sendStatus(401);
    }
}


module.exports = { generateToken, authenticateToken };
