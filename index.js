const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const { resolve } = require("path");
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const connection = mysql.createConnection({
  host: 'jashabrewingdb.cyvabfqcztv5.eu-central-1.rds.amazonaws.com',
  user: 'admin',
  password: 'vKGGEZqpnPA74nY',
  database: 'JashaBrewing',
  port: 3306, // Change the port if necessary
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});



app.use(cors());
app.use(express.json({ limit: '50mb' }));


/////////////////////////////////////////////////// GET ////////////////////////////////////////////////////////////////////////////////

app.get('/AdminData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM Admin', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/CategoryData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM category', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/ItemsData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM Items', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/ShippingData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM Shipping', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});


/////////////////////////////////////////////////// POST ////////////////////////////////////////////////////////////////////////////////


app.post('/SaveCategoryData', async (req, res) => {
  const { categoryData } = req.body;

  try {
    // Delete all rows from the category table
    await new Promise((resolve, reject) => {
      const deleteAllCategoriesQuery = 'DELETE FROM category';
      connection.query(deleteAllCategoriesQuery, (queryError) => {
        if (queryError) {
          reject(queryError);
        } else {
          resolve();
        }
      });
    });

    // Insert new data into the category table
    for (const category of categoryData) {
      const { name, nameEng } = category;

      const insertCategoryQuery = 'INSERT INTO category (name, nameEng) VALUES (?, ?)';
      connection.query(insertCategoryQuery, [name, nameEng], (queryError, results) => {
        if (queryError) {
          console.error('Error inserting category into the database:', queryError);
        } else {
          console.log(`Category '${name}' added to the database with id ${results.insertId}`);
        }
      });
    }

    res.status(200).send('Category data received and processed successfully');
  } catch (error) {
    console.error('Error processing category data:', error);
    res.status(500).send('Internal Server Error');
  }
});




app.post('/SaveItemsData', async (req, res) => {
  const { itemsData } = req.body;

  try {
    // Delete all rows from the Items table
    await new Promise((resolve, reject) => {
      const deleteAllItemsQuery = 'DELETE FROM Items';
      connection.query(deleteAllItemsQuery, (queryError) => {
        if (queryError) {
          reject(queryError);
        } else {
          resolve();
        }
      });
    });

    // Insert new data into the Items table
    for (const item of itemsData) {
      const {
        ime,
        podnaslov,
        opisslo,
        opiseng,
        popust,
        slika,
        category,
        cena
      } = item;

      const insertItemQuery = 'INSERT INTO Items (ime, podnaslov, opisslo, opiseng, popust, slika, category, cena) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

      // Convert Buffer data to Buffer
      const slikaBuffer = Buffer.from(slika.data);

      connection.query(insertItemQuery, [ime, podnaslov, opisslo, opiseng, popust, slikaBuffer, category, cena], (queryError, results) => {
        if (queryError) {
          console.error('Error inserting item into the database:', queryError);
        } else {
          console.log(`Item '${ime}' added to the database with id ${results.insertId}`);
        }
      });
    }

    res.status(200).send('Item data received and processed successfully');
  } catch (error) {
    console.error('Error processing item data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body; // Get the amount from the request body

    const paymentIntent = await stripe.paymentIntents.create({
      currency: "EUR",
      amount, // Use the amount received from the client
      automatic_payment_methods: { enabled: true },
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});