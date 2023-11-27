const express = require('express');
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../../utils/authentication');

const router = express.Router();
require('dotenv').config();

const dbhost = process.env.DB_HOST;
const dbuser = process.env.DB_USER;
const dbpass = process.env.REFRESH_TOKEN;
const dbname = process.env.DB_PASS;

// Setup the MySQL pool connection
const pool = mysql.createPool({
    host: dbhost,
    user: dbuser,
    password: dbpass,
    database: dbname
});

// In-memory cart storage
const carts = {};

// Add item to cart
router.post('/addToCart', authenticateToken, async (req, res) => {
    const { menuItemId } = req.body;
    const customerNumber = req.user.customerNumber; 
    // Initialize cart if it doesn't exist
    if (!carts[customerNumber]) {
        carts[customerNumber] = [];
    }

    try {
        const connection = await pool.getConnection();
        const [menuItem] = await connection.query('SELECT * FROM Menu WHERE menuItemID = ?', [menuItemId]);

        if (menuItem.length === 0) {
            connection.release();
            res.status(404).send('Menu item not found');
            return;
        }

        // Add menu item to cart
        carts[customerNumber].push(menuItem[0]);

        connection.release();
        res.status(200).send('Item added to cart');
    } catch (error) {
        res.status(500).send('Error adding item to cart');
    }
});

// View cart
router.get('/cart', authenticateToken, async (req, res) => {
    const customerNumber = req.user.customerNumber; 
    const cart = carts[customerNumber] || [];
    res.status(200).json(cart);
});

// Checkout

router.post('/checkout', authenticateToken, async (req, res) => {
    console.log(req.user);
    console.log('Request user:', req.user);
    if (!req.user || !req.user.customerNumber) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    const customerNumber = req.user.customerNumber;
    let connection;

    try {
        connection = await pool.getConnection();
        const cart = carts[customerNumber];

        // Check if the cart is present and not empty
        if (!cart || cart.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Begin transaction
        await connection.beginTransaction();

        //let totalPrice = 0;
        let menuItemNames = cart.map(item => item.menuItemName); // Assuming 'menuItemName' is the correct field
        const totalPrice = cart.reduce((acc, item) => acc + parseFloat(item.price), 0);

// Join names with a comma only if there are more than two items
        let concatenatedItemNames = menuItemNames.length > 2 ? menuItemNames.join(', ') : menuItemNames.join(' and ');




        // Create order with concatenated names if there are more than 2 items
        const [orderResult] = await connection.query(
            'INSERT INTO `Order` (customerNumber, totalPrice, menuItem, status) VALUES (?, ?, ?, "Order Placed")',
            [customerNumber, totalPrice, concatenatedItemNames]
        );

        // Code for handling the cart and creating the order...
       
        delete carts[customerNumber];

        // Commit transaction
        await connection.commit();
        res.status(200).json({ message: 'Order placed', items: concatenatedItemNames, orderId: orderResult.insertId, totalPrice: totalPrice });

    } catch (error) {
        // If we catch any errors, rollback the transaction
        if (connection) {
            await connection.rollback();
        }
        console.error('Checkout error:', error.message);
        res.status(500).json({ message: 'Error processing order' });
    } finally {
        // Always release the connection in the end
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;
