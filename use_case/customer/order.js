require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../../utils/authentication');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Replace with your StripeAPI secret key 
const twilio = require('twilio');

const router = express.Router();

const dbhost = process.env.DB_HOST;
const dbuser = process.env.DB_USER;
const dbpass = process.env.DB_PASS;
const dbname = process.env.DB_Name;

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = new twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

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
    const { menuItemIDs } = req.body;
    const customerNumber = req.user.customerNumber;

    if (!carts[customerNumber]) {
        carts[customerNumber] = [];
    }

    try {
        const connection = await pool.getConnection();

        for (const menuItemID of menuItemIDs) {
            const [menuItem] = await connection.query('SELECT * FROM Menu WHERE menuItemID = ?', [menuItemID]);

            if (menuItem.length === 0) {
                connection.release();
                return res.status(404).send(`Menu item with ID ${menuItemID} not found`);
            }

            carts[customerNumber].push(menuItem[0]);
        }

        connection.release();
        res.status(200).send('Items added to cart');
    } catch (error) {
        console.error('Error adding items to cart:', error);
        res.status(500).send('Error adding items to cart');
    }
});

// View cart
router.get('/cart', authenticateToken, async (req, res) => {
    const customerNumber = req.user.customerNumber;
    const cart = carts[customerNumber] || [];
    res.status(200).json(cart);
});

// Delete item from cart
router.delete('/deleteFromCart', authenticateToken, async (req, res) => {
    const { menuItemID } = req.body;
    const customerNumber = req.user.customerNumber;

    if (!carts[customerNumber]) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    try {
        const connection = await pool.getConnection();

        const index = carts[customerNumber].findIndex(item => item.menuItemID === menuItemID);

        if (index === -1) {
            connection.release();
            return res.status(404).json({ message: `Menu item with ID ${menuItemID} not found in the cart` });
        }

        carts[customerNumber].splice(index, 1);

        connection.release();
        res.status(200).json({ message: 'Item deleted from cart' });
    } catch (error) {
        console.error('Error deleting item from cart:', error);
        res.status(500).json({ message: 'Error deleting item from cart' });
    }
});

// Checkout
router.post('/checkout', authenticateToken, async (req, res) => {
    if (!req.user || !req.user.customerNumber) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    const customerNumber = req.user.customerNumber;
    let connection;

    try {
        connection = await pool.getConnection();

        const orderPlacedTime = new Date(); // Add this line for the real-time order placement

        let menuItemNames = carts[customerNumber].map(item => item.menuItemName);
        const totalPrice = carts[customerNumber].reduce((acc, item) => acc + parseFloat(item.price), 0);
        let concatenatedItemNames = menuItemNames.length > 2 ? menuItemNames.join(', ') : menuItemNames.join(' and ');

        const { pickupTime, paymentMethod, customerPhoneNumber } = req.body;

        if (!isValidPickupTime(pickupTime)) {
            throw new Error('Invalid pickup time. Pickup time must be within operational hours (10 AM to 9 PM).');
        }

        const totalPriceCents = Math.round(totalPrice * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalPriceCents,
            currency: 'usd',
            payment_method: paymentMethod,
            confirmation_method: 'manual',
            confirm: true,
            return_url: 'https://www.youtube.com',
        });

        if (paymentIntent.status === 'succeeded') {
            let [orderResult] = await connection.query(
                'INSERT INTO `Order` (customerNumber, totalPrice, menuItem, status, pickupTime, orderTime) VALUES (?, ?, ?, "Order Placed", ?, ?)',
                [customerNumber, totalPrice, concatenatedItemNames, pickupTime, orderPlacedTime]
            );

            const smsMessage = `Thank you for your order! Your order (${concatenatedItemNames}) will be ready for pickup at ${pickupTime}. Total: $${totalPrice}.`;
            await twilioClient.messages.create({
                body: smsMessage,
                from: twilioPhoneNumber,
                to: customerPhoneNumber,
            });

            delete carts[customerNumber];

            await connection.commit();

            res.status(200).json({
                message: 'Order placed',
                items: concatenatedItemNames,
                orderId: orderResult.insertId,
                totalPrice: totalPrice,
                pickupTime: pickupTime,
            });
        } else {
            throw new Error('Payment failed. Please try again.');
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Checkout error:', error.message);
        res.status(500).json({ message: 'Error processing order', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// Cancel Order API
router.post('/cancelOrder', authenticateToken, async (req, res) => {
    const { orderId } = req.body;
    const customerNumber = req.user.customerNumber;

    try {
        const connection = await pool.getConnection();

        const [order] = await connection.query('SELECT * FROM `Order` WHERE orderID = ? AND customerNumber = ?', [orderId, customerNumber]);

        if (order.length === 0) {
            connection.release();
            return res.status(404).json({ message: `Order with ID ${orderId} not found for the customer` });
        }

        const orderTime = new Date(order[0].orderTime);
        const currentTime = new Date();
        const timeDifference = currentTime - orderTime;

        if (timeDifference <= 10 * 60 * 1000) {
            await connection.query('UPDATE `Order` SET status = "Canceled" WHERE orderID = ?', [orderId]);
            connection.release();
            res.status(200).json({ message: 'Order canceled successfully' });
        } else {
            connection.release();
            res.status(400).json({ message: 'Order cannot be canceled after 10 minutes of placing it' });
        }
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ message: 'Error canceling order' });
    }
});

// Reciept
router.get('/receipt', authenticateToken, async (req, res) => {
    const customerNumber = req.user.customerNumber;
    const { orderID } = req.body;

    try {
        const connection = await pool.getConnection();
        // Query to get the specific order for the authenticated customer
        const [orders] = await connection.query('SELECT * FROM `Order` WHERE orderID = ? AND customerNumber = ?', [orderID, customerNumber]);

        connection.release();

        if (orders.length === 0) {
            res.status(404).send('Order not found or not belonging to the customer');
            return;
        }

        const order = orders[0];
        const receipt = {
            orderID: order.orderID,
            items: order.menuItem, // assuming this contains the names of the items
            totalPrice: order.totalPrice,
            status: order.status
        };

        res.status(200).json(receipt);
    } catch (error) {
        res.status(500).send('Error retrieving receipt');
    }
});

// Reorder
router.post('/reorder', authenticateToken, async (req, res) => {
    const customerNumber = req.user.customerNumber;
    const { orderID } = req.body;

    try {
        const connection = await pool.getConnection();
        
        // Query to get the specific order
        const [orders] = await connection.query('SELECT * FROM `Order` WHERE orderID = ? AND customerNumber = ?', [orderID, customerNumber]);

        if (orders.length === 0) {
            connection.release();
            res.status(404).send('Order not found or not belonging to the customer');
            return;
        }

        const originalOrder = orders[0];
        
        // Create a new order with the same details
        const [newOrderResult] = await connection.query(
            'INSERT INTO `Order` (customerNumber, totalPrice, menuItem, status, pickupTime, orderTime) VALUES (?, ?, ?, "Order Placed", ?, ?)',
            [customerNumber, originalOrder.totalPrice, originalOrder.menuItem, originalOrder.pickupTime, new Date()]
        );

        connection.release();
        res.status(200).json({ message: 'Order placed', newOrderId: newOrderResult.insertId });
    } catch (error) {
        console.error('Error processing reorder:', error);
        res.status(500).send(`Error processing reorder: ${error.message}`);
    }
});

// Orders
router.get('/orders', authenticateToken, async (req, res) => {
    const customerNumber = req.user.customerNumber;

    try {
        const connection = await pool.getConnection();
        // Query to get all orders of the authenticated customer
        const [orders] = await connection.query('SELECT * FROM `Order` WHERE customerNumber = ?', [customerNumber]);

        connection.release();

        if (orders.length === 0) {
            res.status(404).send('No orders found for this customer');
            return;
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error retrieving orders:', error); // Log the error
        res.status(500).send('Error retrieving orders');
    }
});

// function for implementing the pickUpTime condition
function isValidPickupTime(pickupTime) {
    const operationalStartTime = 10;
    const operationalEndTime = 21;

    const pickupDate = new Date(pickupTime);

    if (isNaN(pickupDate.getTime())) {
        return false;
    }

    const pickupHour = pickupDate.getHours();
    if (pickupHour < operationalStartTime || pickupHour >= operationalEndTime) {
        return false;
    }

    return true;
}

module.exports = router;