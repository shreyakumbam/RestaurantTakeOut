const dotenv = require('dotenv');
const aws = require('aws-sdk');
const {connection} = require('../../utils/database');

dotenv.config(); // Load environment variables from .env file if it exists

const region = process.env.DB_REGION;
const bucketName = process.env.S3_BUCKET_NAME;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

const s3 = new aws.S3({
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: 'v4'
});

async function fetchImage(key) {
    const params = {
        Bucket: bucketName,
        Key: key
    };

    try {
        const data = await s3.getObject(params).promise();
        return data.Body;
    } catch (err) {
        console.error('Error fetching image:', err);
        throw err; // Rethrow the error for the caller to handle
    }
}


function getMenuItemDetails(menuItemName, callback) {
    // Query to get the price and allergen details (replace with actual table and columns)
    connection.query('SELECT price, allergenDetails FROM Menu WHERE menuItemName = ?', [menuItemName], (error, details) => {
      if (error) {
        return callback(error);
      }
  
      // Query to get ingredient quantity map
      connection.query('SELECT ingredientName, quantityRequired FROM MenuItemIngredients WHERE menuItemName = ?', [menuItemName], (error, ingredients) => {
        if (error) {
          return callback(error);
        }
  
        // Construct the ingredientQuantityMap from the query result
        let ingredientQuantityMap = {};
        ingredients.forEach(ingredient => {
          ingredientQuantityMap[ingredient.ingredientName] = ingredient.quantityRequired;
        });
  
        // Construct the final JSON object
        let menuItemDetails = {
          menuItemName: menuItemName,
          price: details.length > 0 ? details[0].price : null, // Assuming that details array has the price
          allergenDetails: details.length > 0 ? details[0].allergenDetails : null, // Assuming that details array has the allergen details
          ingredientQuantityMap: ingredientQuantityMap
        };
  
        // Pass the final object to the callback
        callback(null, menuItemDetails);
      });
    });
  }


module.exports = { fetchImage , getMenuItemDetails}