const http = require('http');
const url = require('url');
const express = require('express');
const bodyParser = require('body-parser');

const { signUp, signIn } = require('./use_case/manager/employeeSign.js');
const {verifyToken,  
    fetchEmployee, 
    requestRoleChange, 
    fetchRoleChangeReqeust, 
    approveRoleChangeRequest,
    declineRoleChangeRequest} = require('./use_case/manager/roleAssignment.js');
const {menuUpload} = require('./use_case/manager/menuUpload.js')

const { generateUploadURL } = require('./use_case/manager/pasS3Url.js');

// const menuRoutes = require('./use_case/customer/menu.js');
// const orderRoutes = require('./use_case/customer/order.js');
// const userRoutes = require('./use_case/customer/user.js');

const searchRouter = require('./use_case/serach/Search.js')

const app = express();
const PORT = 3000;


// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.static('front'));

// app.use('/menu', menuRoutes);
// app.use('/order', orderRoutes);
// app.use('/user', userRoutes);

app.use('/search', searchRouter);

// Define a route for handling POST requests to "/signup"
app.post('/signup', (req, res) => {
    const data = req.body;
    if (!data) {
        return res.status(400).json({ message: 'Invalid JSON' });
    }
    signUp({ body: data }, res);
});



app.post('/s3Url', async (req, res) => {
  const imageName = req.body.imageName; // Get the image name from the request body
  if (!imageName) {
    return res.status(400).send({ error: 'Image name is required' });
  }
  
  try {
    const url = await generateUploadURL(imageName);
    res.send({ url });
  } catch (error) {
    res.status(500).send({ error: 'Error generating the upload URL' });
  }
})

// Define a route for handling POST requests to "/signin"
app.post('/signin', (req, res) => {
    const data = req.body;
    if (!data) {
        return res.status(400).json({ message: 'Invalid JSON' });
    }
    signIn({ body: data }, res);
});

// Define a route for handling GET requests to "/manager/employees"
app.get('/manager/employees', (req, res) => {
    // Implement verifyToken and fetchEmployee logic here
    verifyToken(req, res, (err, initiatingManagerID) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message });
        }
        fetchEmployee(req, res);
    });
});

// Define a route for handling POST requests to "/manager/role-requests"
app.post('/manager/role-requests', (req, res) => {
    // Implement verifyToken and requestRoleChange logic here
    verifyToken(req, res, (err, initiatingManagerID) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message });
        }
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'Invalid JSON' });
        }
        req.body = { ...data, initiatingManagerID };
        requestRoleChange(req, res);
    });
});

// Define a route for handling GET requests to "/manager/role-requests"
app.get('/manager/role-requests', (req, res) => {
    // Implement verifyToken and fetchRoleChangeReqeust logic here
    verifyToken(req, res, (err, initiatingManagerID) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message });
        }
        fetchRoleChangeReqeust(req, res);
    });
});

// Define a route for handling PUT requests to "/manager/role-change-requests/:userID/approve"
app.put('/manager/role-change-requests/:userID/approve', (req, res) => {
    const userID = req.params.userID;
    req.params = { userID }; // Attach the userID to the request object as params.

    // Implement verifyToken and approveRoleChangeRequest logic here
    verifyToken(req, res, (err, initiatingManagerID) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message });
        }
        approveRoleChangeRequest(req, res);
    });
});

// Define a route for handling DELETE requests to "/manager/role-change-requests/:userID/decline"
app.delete('/manager/role-change-requests/:userID/decline', (req, res) => {
    const userID = req.params.userID;
    req.params = { userID }; // Attach the userID to the request object as params.

    // Implement verifyToken and declineRoleChangeRequest logic here
    verifyToken(req, res, (err, initiatingManagerID) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message });
        }
        declineRoleChangeRequest(req, res);
    });
});

// Define a route for handling POST requests to "/manager/menu"
app.post('/manager/menu', (req, res) => {
    // Implement verifyToken and menuUpload logic here
    verifyToken(req, res, (err, initiatingManagerID) => {
        if (err) {
            return res.status(err.status || 500).json({ message: err.message });
        }
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'Invalid JSON' });
        }
        menuUpload({ body: data }, res);
    });
});

// Default route for handling all other requests
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});