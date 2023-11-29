const express = require('express');
const stripe = require('stripe')('sk_test_51OHUZAHyLIxiU1r8r8m8DjtBWixSPFYbom99yQLenfts2Nwik3BpeysEVx6ZkabsdvsfuVaUzx2qLX5JlWVjlUTG00ftca6C6D');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/create-payment-intent', async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: 'usd',
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Calculate order amount based on items (customize as per your app logic)
function calculateOrderAmount(items) {
  // Replace with your own logic to calculate the order amount
  return 1000;
}
