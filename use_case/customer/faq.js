const express = require('express');
const router = express.Router();

// Hardcoded FAQ data
const faqs = [
    { 
        question: "How do I place an order for pickup?",
        answer: "You can place an order for pickup through our website, mobile app, or by calling us directly. Simply select the items you'd like to order, choose 'pickup' at checkout, and provide the necessary details."
    },

    {
        question: "What are the restaurant's hours for pickup orders?",
        answer: "Our pickup hours are from 10AM - 9PM. Please note that these hours are subject to change on holidays or special events."
    },
    {
        question: "Where do I pick up my order in the restaurant?",
        answer: "Pickup orders can be collected at our dedicated pickup counter. Please follow the signs in the restaurant or ask a staff member for assistance if needed."
    },
    {
        question: "How long does it take for my pickup order to be ready?",
        answer: "The average preparation time for pickup orders is approximately 10 minutes, but this may vary depending on the order size and current demand."
    },
    {
        question: "Is there a minimum order amount for pickup?",
        answer: "No, there is no minimum order amount required for pickup. However, certain promotional offers might have specific terms and conditions."
    },
    {
        question: "Can I make changes to my order after placing it?",
        answer: " If you need to make changes to your order, please contact us immediately at +1 1234567809. We can accommodate changes only if the order is not yet in preparation."
    },
    {
        question: "Can I order for someone else to pick up?",
        answer: "Absolutely! Just provide the person's name and contact information in the 'Special Instructions' section when placing your order."
    }
];

// Route to get FAQs
router.get('/', (req, res) => {
    res.status(200).json(faqs);
});

module.exports = router;
