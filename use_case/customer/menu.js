const express = require('express');
const mysql = require('mysql2');
const { authenticateToken } = require('../../utils/authentication');

const router = express.Router();
require('dotenv').config();

const dbhost = process.env.DB_HOST;
const dbuser = process.env.DB_USER;
const dbpass = process.env.DB_PASS;
const dbname = process.env.DB_Name;


const db = mysql.createConnection({
    host: dbhost,
    user: dbuser,
    password: dbpass,
    database: dbname    
});


db.connect(err => {
    if(err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

// Endpoint to retrieve all menu items
router.get('/', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM Menu';
    
    db.query(sql, (err, results) => {
        if(err) {
            res.status(500).json({error: 'Failed to fetch menu items.'});
            return;
        }
        res.status(200).json(results);
    });
});

module.exports = router;
