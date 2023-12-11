const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3306;

app.use(bodyParser.json());

// Create a MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_Name,
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Fetch Inventory
app.get('/fetchInventory', (req, res) => {
  const query = 'SELECT * FROM Inventory';

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      const inventory = results.map((row) => ({
        ingredientID: row.ingredientID,
        ingredientName: row.ingredientName,
        quantity: row.quantity,
      }));

      res.status(200).json(inventory);
    }
  });
});

// Update Inventory
app.post('/updateInventory', (req, res) => {
  try {
    const data = req.body;

    const ingredientName = data.ingredientName;
    const quantity = data.quantity;

    // Check if the ingredient already exists
    const checkQuery = 'SELECT * FROM Inventory WHERE ingredientName = ?';

    db.query(checkQuery, [ingredientName], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else if (results.length === 0) {
        // Insert a new ingredient
        const insertQuery = 'INSERT INTO Inventory (ingredientName, quantity) VALUES (?, ?)';

        db.query(insertQuery, [ingredientName, quantity], (err, insertResults) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.status(201).json({ message: 'Inventory item added' });
          }
        });
      } else {
        // Update the existing ingredient
        const updateQuery = 'UPDATE Inventory SET quantity = ? WHERE ingredientName = ?';

        db.query(updateQuery, [quantity, ingredientName], (err, updateResults) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.status(200).json({ message: 'Inventory item updated' });
          }
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid JSON data' });
  }
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the server
app.listen(port, () => {
  console.log('Server is running on port 3306');
});
