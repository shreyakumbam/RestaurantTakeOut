require('dotenv').config()

const express = require('express')
const searchService = express()

const mySql = require('mysql') 
searchService.use(express.json())

function initiateDBConnection() {
    //Create SQL connection logic
    var databaseConnection = mySql.createConnection({
        host: process.env.DATABASE_URL,
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.DATABASE_PORT
    });
    return databaseConnection
}


// endpoint for getting menu item. Optional Query param that provides the excluted ingredient
searchService.get('/menu/:item', (request, response) => {
    let responseMessage;
    let sqlQueryStatement;
    const excludeIngredient = request.query.excludeIngredient


    try{
        var dBCon = initiateDBConnection();
        
        dBCon.connect(function (err) {

          if (err) throw err; // throws error in case if connection is corrupted/disconnected
          const requestedItem = request.params.item 
          

          if(!requestedItem || requestedItem.trim() == ''){
            responseMessage.message = 'Invalid Input'
            response.status(400).send(resMsg);
          }

          requestedItem.trim()
          sqlQueryStatement = "SELECT * FROM Menu WHERE menuItemName = ?"
          

          if(excludeIngredient){
            sqlQueryStatement = 'SELECT M.menuItemName FROM Menu AS M LEFT JOIN MenuItemIngredients AS MI ON M.menuItemID = MI.menuItemID LEFT JOIN Inventory AS I ON MI.ingredientID = I.ingredientID WHERE M.menuItemName = ? AND I.ingredientName = ? AND MI.ingredientID IS NULL;' 
          }
          
          sqlQueryStatement+=';'
          dBCon.query(sqlQueryStatement,[requestedItem, excludeIngredient], function (err, result) {
              if (err) {
                responseMessage.message = "Item Unavailable";
                responseMessage.body = "MySQL server error: CODE = "
                  + err.code + " SQL of the failed query: "
                  + err.sql + " Textual description : " + err.sqlMessage;
                response.status(503).send(responseMessage);
              } else {
                // Step 1 : Convert databse result set into JSON String Step 2: Parse to actual JSON Step 3: finally convert JSON into JSON String
                if(result == null){
                    responseMessage.message = "No Item Found"
                    response.status(404).send(responseMessage);
                }
                var result_response = json(result)
                response.set('content-type', 'application/json')
                response.status(200).send(result_response);
                dBCon.end();
              }
            });
      });
    }
    catch(err) {
        response.status(500).send("Server Error");
    }

})

//Endpoint to get menu item without allegern
searchService.get('/menu/exclude/allergen/:AllergenID', (request, response) => {
  let responseMessage = {};

  try {
      var dBCon = initiateDBConnection();

      dBCon.connect(function (err) {
          if (err) {
              console.error('MySQL connection error:', err);
              responseMessage.message = "Server Error";
              response.status(500).send(responseMessage);
          } else {
              const allergenID = request.params.AllergenID;

              if (isNaN(allergenID) || allergenID <= 0) {
                  responseMessage.message = "Invalid AllergenID parameter";
                  response.status(400).send(responseMessage);
                  return;
              }

              const sqlQueryStatement =
                  'SELECT M.* FROM Menu AS M ' +
                  'LEFT JOIN MenuItemAllergens AS MA ON M.menuItemID = MA.menuItemID ' +
                  'WHERE MA.allergenID != ? OR MA.allergenID IS NULL';
              const values = [allergenID];

              dBCon.query(sqlQueryStatement, values, function (err, result) {
                  if (err) {
                      console.error('MySQL query error:', err);
                      responseMessage.message = "Server Error";
                      response.status(500).send(responseMessage);
                  } else {
                      response.status(201).json(result);
                  }
                  dBCon.end();
              });
          }
      });
  } catch (err) {
      console.error('Server error:', err);
      response.status(500).send("Server Error");
  }
});

//Endpoint to get menu item lower then given price
searchService.get('/menu/item/price/:price', (request, response) => {
    let responseMessage = {};

    try {
        var dBCon = initiateDBConnection();

        dBCon.connect(function (err) {
            if (err) {
                // Proper error handling
                console.error('MySQL connection error:', err);
                responseMessage.message = "Server Error";
                response.status(500).send(responseMessage);
            } else {
                const price = request.params.price;

                if (isNaN(price) || price <= 0) {
                    responseMessage.message = "Invalid price parameter";
                    response.status(400).send(responseMessage);
                    return;
                }

                const sqlQueryStatement = "SELECT * FROM Menu WHERE itemPrice < ?";
                const values = [price];

                dBCon.query(sqlQueryStatement, values, function (err, result) {
                    if (err) {
                        // Proper error handling
                        console.error('MySQL query error:', err);
                        responseMessage.message = "Server Error";
                        response.status(500).send(responseMessage);
                    } else {
                        response.status(201).json(result);
                    }
                    dBCon.end();
                });
            }
        });
    } catch (err) {
        // Proper error handling
        console.error('Server error:', err);
        response.status(500).send("Server Error");
    }
});

searchService.listen(3000, () => console.log('server started'))
