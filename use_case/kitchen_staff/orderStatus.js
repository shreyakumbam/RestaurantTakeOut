const url = require('url');

const dotenv = require('dotenv');
dotenv.config();

const validStatuses = ['Pending', 'Accepted', 'InKitchen', 'Ready', 'Denied'];
const { connection } = require('../../utils/database');

const updateOrderStatus = (req, res) => {
    const { method, url: reqUrl } = req;
    const parsedUrl = url.parse(reqUrl, true);

    const orderID = req.params.orderID;
    
    try {
        const requestData = req.body;

        if (requestData.newStatus && validStatuses.includes(requestData.newStatus)) {
            if (isNaN(orderID)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid order ID' }));
                return;
            }

            const updateQuery = "UPDATE `Order` SET status = ? WHERE orderID = ?;"

            connection.query(updateQuery, [requestData.newStatus, orderID], (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Database error', details: error.message }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Order status updated' }));
                }
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid or unsupported request data' }));
        }
    } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or unsupported request data' }));
    }
};

module.exports = { updateOrderStatus };