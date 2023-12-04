const mysql = require('mysql2'); // Use mysql2 here
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
dotenv.config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbName = process.env.DB_NAME;
const dbRegion = process.env.DB_REGION; // Make sure to set your database region

// Configure AWS SDK
AWS.config.update({
  region: dbRegion,
  access_key: process.env.ACCESS_KEY,
  secret_key: process.env.SECRET_ACCESS_KEY
});

// Generate the token
const signer = new AWS.RDS.Signer({
  region: dbRegion,
  hostname: dbHost,
  port: 3306,
  username: dbUser,
});

const token = signer.getAuthToken({
  username: dbUser,
});

console.log(`your token: ${token}`)

// MySQL connection
const connection = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: token, // Use the token here
  database: dbName,
  port: 3306, // default MySQL port, adjust if yours is different
  ssl: 'Amazon RDS' // Use SSL
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected as id ' + connection.threadId);
  connection.end();
});
