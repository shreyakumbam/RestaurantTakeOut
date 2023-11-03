const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Rtssenkp25@@",
    database: "demodb"
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
