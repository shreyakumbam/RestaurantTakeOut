const axios = require('axios');
const express = require('express');
const mysql = require('mysql2');

require('dotenv').config();
const router = express.Router();

// Setup MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_Name
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

const inferAllergens = (ingredients) => {
    const knownAllergens = ['Dairy', 'Egg', 'Gluten', 'Grain', 'Peanut', 'Seafood', 'Sesame', 'Shellfish', 'Soy', 'Sulfite', 'Tree Nut', 'Wheat'];
    let allergens = [];

    ingredients.forEach(ingredient => {
        knownAllergens.forEach(allergen => {
            if (ingredient.name.toLowerCase().includes(allergen.toLowerCase())) {
                allergens.push(allergen);
            }
        });
    });

    return [...new Set(allergens)]; // Return unique values
};

// Function to fetch recipe details from Spoonacular
const getRecipeDetails = async (id) => {
    const endpoint = `/recipes/${id}/information`;
    const baseURL = 'https://api.spoonacular.com';
    const apiKey = process.env.SPOONACULAR_API_KEY; // Make sure you have set this in your .env file

    try {
        const response = await axios.get(`${baseURL}${endpoint}`, {
            params: {
                apiKey: apiKey,
                includeNutrition: true
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        throw error;
    }
};

// Endpoint to fetch and insert menu items from Spoonacular
router.post('/fetch-from-spoonacular', async (req, res) => {
    const recipeId = req.body.recipeId; // You can pass the recipe ID in the request body

    try {
        const recipeDetails = await getRecipeDetails(recipeId);
        const allergens = inferAllergens(recipeDetails.extendedIngredients);


        // Transforming the data to fit the menu table schema
        const menuData = {
            menuItemName: recipeDetails.title,
            price: recipeDetails.pricePerServing/10,
            allergenDetails: allergens.join(', ') || 'None' // Assuming 'None' for simplicity; this could be extracted if available
        };

        // Inserting data into the menu table
        const sql = 'INSERT INTO Menu (menuItemName, price, allergenDetails) VALUES (?, ?, ?)';
        db.query(sql, [menuData.menuItemName, menuData.price, menuData.allergenDetails], (err, result) => {
            if (err) {
                res.status(500).json({ error: 'Failed to insert menu item.' });
                return;
            }
            res.status(200).json({ message: 'Menu item added successfully', menuItemId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from Spoonacular.' });
    }
});

module.exports = router;
