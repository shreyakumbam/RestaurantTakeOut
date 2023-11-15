const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_Name;

const connection = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPass,
  database: dbName,
  port: 3306  // default MySQL port, adjust if yours is different
});

connection.connect(err => {
    if(err) {
        console.error('Failed to connect to the database', err);
    } else {
        console.log('Connected to the database');
    }
});

module.exports = {
    connection
};
