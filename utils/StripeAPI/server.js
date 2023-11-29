const express = require('express');
const stripe = require('stripe')('sk_test_51OHUZAHyLIxiU1r8r8m8DjtBWixSPFYbom99yQLenfts2Nwik3BpeysEVx6ZkabsdvsfuVaUzx2qLX5JlWVjlUTG00ftca6C6D');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Assuming your HTML file is in a folder named "public"

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Replace with the actual amount in cents
      currency: 'usd',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
