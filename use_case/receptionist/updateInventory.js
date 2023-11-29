const http = require('http');
const url = require('url');
const mysql = require('mysql2');
const fs = require('fs');

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'daily-db.cxalyiy1trhs.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: 'dailydb10!',
    database: 'dailydb',
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Create an HTTP server
const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  if (req.method === 'GET' && pathname === '/fetchInventory') {
    // Retrieve and return the inventory
    const query = 'SELECT * FROM Inventory';

    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      } else {
        const inventory = results.map((row) => ({
          ingredientID: row.ingredientID,
          ingredientName: row.ingredientName,
          quantity: row.quantity,
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(inventory));
      }
    });
  } else if (req.method === 'POST' && pathname === '/updateInventory') {
    // Handle adding or updating an inventory item
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        const ingredientName = data.ingredientName;
        const quantity = data.quantity;

        // Check if the ingredient already exists
        const checkQuery = 'SELECT * FROM Inventory WHERE ingredientName = ?';

        db.query(checkQuery, [ingredientName], (err, results) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          } else if (results.length === 0) {
            // Insert a new ingredient
            const insertQuery = 'INSERT INTO Inventory (ingredientName, quantity) VALUES (?, ?)';

            db.query(insertQuery, [ingredientName, quantity], (err, insertResults) => {
              if (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
              } else {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Inventory item added' }));
              }
            });
          } else {
            // Update the existing ingredient
            const updateQuery = 'UPDATE Inventory SET quantity = ? WHERE ingredientName = ?';

            db.query(updateQuery, [quantity, ingredientName], (err, updateResults) => {
              if (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Inventory item updated' }));
              }
            });
          }
        });
      } catch (error) {
        console.error(error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON data' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// Start the server
const port = process.env.PORT || 3306;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});