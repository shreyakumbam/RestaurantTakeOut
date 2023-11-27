const express = require('express');
const bodyParser = require('body-parser');

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/user'); 

const app = express();

// Middlewares
app.use(bodyParser.json());

// Routes
app.use('/menu', menuRoutes);
app.use('/order', orderRoutes);
app.use('/user', userRoutes); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; 

