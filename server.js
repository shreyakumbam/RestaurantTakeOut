const http = require('http');
const url = require('url');

const { signUp, signIn } = require('./use_case/manager/employeeSign.js');
const {verifyToken,  
    fetchEmployee, 
    requestRoleChange, 
    fetchRoleChangeReqeust, 
    approveRoleChangeRequest,
    declineRoleChangeRequest} = require('./use_case/manager/roleAssignment.js');

const {menuUpload} = require('./use_case/manager/menuUpload.js')

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
    } else if (path === '/manager/employees' && method === 'GET') {
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
    } else if (path === '/manager/role-requests' && method === 'POST') {
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
    } else if (path === '/manager/role-requests' && method === 'GET') {
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
            fetchRoleChangeReqeust(req, res);
        });
    
    } else if (path.startsWith('/manager/role-change-requests/') && path.endsWith('/approve') && method === 'PUT') {
        const userID = path.split('/')[3]; // Extract the userID from the URL.
        req.params = { userID: userID }; // Attach the userID to the request object as params.
    
        verifyToken(req, res, (err, initiatingManagerID) => {
            if(err) {
                res.writeHead(err.status || 500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: err.message }));
                return;
            }
            approveRoleChangeRequest(req, res);
        });
    } else if (path.startsWith('/manager/role-change-requests/') && path.endsWith('/decline') && method === 'DELETE') {
        const userID = path.split('/')[3]; // Extract the userID from the URL.
        req.params = { userID: userID }; // Attach the userID to the request object as params.
        verifyToken(req, res, (err, initiatingManagerID) => {
            if(err) {
                res.writeHead(err.status || 500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: err.message }));
                return;
            }
            declineRoleChangeRequest(req, res);
        });
    } else if (path === '/manager/menu' && method === 'POST') {
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
                menuUpload({ body: data }, res); 
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
