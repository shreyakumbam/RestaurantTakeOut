const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const {connection} = require('../../utils/database');

const SECRET_KEY = process.env.JWT_Secret_key;

const menuUpload = (req, res) => {
    const { menuItemName, price, allergenDetails, ingredientQuantityMap } = req.body;

    connection.query('SELECT * FROM Menu WHERE menuItemName = ?', [menuItemName], (error, menus) => {
        if (error) {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Internal server error1' }));
            return;
        }
        if (menus.length > 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Menu already exists' }));
            return;
        }

        connection.query('INSERT INTO Menu (menuItemName, price, allergenDetails) VALUES (?, ?, ?)',
            [menuItemName, price, allergenDetails], (err, result) => {
                if (err) {
                    console.error(err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Internal server error2' }));
                    return;
                }

                const menuId = result.insertId; // Get the auto-generated ID of the new menu item
                let ingredientInserts = [];
                Object.entries(ingredientQuantityMap).forEach(([ingredientName, quantity]) => {
                    ingredientInserts.push([menuItemName, ingredientName, quantity]);
                });

                connection.query('INSERT INTO MenuItemIngredients (menuItemName, ingredientName, quantityRequired) VALUES ?',
                    [ingredientInserts], (ingredientError) => {
                        if (ingredientError) {
                            console.error(ingredientError);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'Internal server error3' }));
                            return;
                        }
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'New Menu and MenuItemIngredients uploaded successfully' }));
                    });
            });
    });
};


module.exports = {menuUpload};