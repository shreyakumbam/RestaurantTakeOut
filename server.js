const http = require('http');
const { signUp, signIn } = require('./routes/user');
const {verifyToken,  fetchEmployee, requestRoleChange} = require('./routes/roleAssignment');

const PORT = 3000;

const parseJSONBody = (req, callback) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            callback(null, data);
        } catch (err) {
            callback(err, null);
        }
    });
};

const server = http.createServer((req, res) => {
    const path = req.url;
    const method = req.method;

    if (path === '/signup' && method === 'POST') {
        parseJSONBody(req, (err, data) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid JSON' }));
                return;
            }
            signUp({ body: data }, res); 
        });
    } else if (path === '/signin' && method === 'POST') {
        parseJSONBody(req, (err, data) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid JSON' }));
                return;
            }
            signIn({ body: data }, res);
        });
    } else if (path === '/fetchEmployee' && method === 'GET') {
        verifyToken(req, res, (err, initiatingManagerID) => {  // Here we don't use the initiatingManagerID
            if(err) {
                console.log(initiatingManagerID)
                console.log("you fail token verification")
                console.error("Token verification failed:", err);
                res.writeHead(err.status || 500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: err.message }));
                return;
            }
            console.log("you pass token verification")
            fetchEmployee(req, res);
        });
    } else if (path === '/rolechangerequests' && method === 'POST') {
        verifyToken(req, res, (err, initiatingManagerID) => {
            if(err) {
                res.writeHead(err.status || 500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: err.message }));
                return;
            }
            parseJSONBody(req, (err, data) => {
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                    return;
                }
                req.body = { ...data, initiatingManagerID };
                requestRoleChange(req, res);
            });
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
