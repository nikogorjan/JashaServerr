const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const { resolve } = require("path");
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const fs = require('fs');
const PDFDocument = require('pdfkit');
const pdfmake = require('pdfmake');
const table = require('pdfkit-table');
const PDFDocumentWithTables = require('./PDFDocumentWithTables');

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

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME, // Your Gmail username
      pass: process.env.EMAIL_PASSWORD, // Your Gmail password or an app-specific password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


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

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, cartData } = req.body;

    // Generate a PDF file with cartData
    const pdfPath = `${__dirname}/cartData.pdf`;
    const pdfDoc = new PDFDocumentWithTables();
    pdfDoc.font('./PTSerifProCaptRg.OTF');
    // Pipe the PDF to a file
    const stream = fs.createWriteStream(pdfPath);
    pdfDoc.pipe(stream);

    // Create a table
    pdfDoc.text(`Nov nakup - ${new Date().toLocaleString()}`);
    pdfDoc.moveDown();
    pdfDoc.moveDown();

    const table = {
      headers: ['Ime',"Pakiranje", 'Količina', 'Cena'],
      rows: cartData.cartItems.map(item => [item.ime,item.cena.name.toString(), item.quantity.toString(), item.cena.price.toString() + '€']),
    };

    pdfDoc.table(table, { width: 500 });
    pdfDoc.moveDown();


    pdfDoc.text(`Cena dostave: ${(cartData.shippingCost / 100).toFixed(2)}€`, { align: 'right', continued: true });
    pdfDoc.moveDown();

    const fullPrice = cartData.cartItems.reduce((total, item) => {
      return total + item.quantity * item.cena.price;
    }, 0) + cartData.shippingCost / 100;

    pdfDoc.text(`Cena paketa: ${fullPrice.toFixed(2)}€`, { align: 'right', continued: false });
    pdfDoc.moveDown();
    pdfDoc.moveDown();

    pdfDoc.text(`Način plačila: ${cartData.placiloOption}`, { align: 'left' });
    pdfDoc.text(`Telefon: ${cartData.customerPhone}`, { align: 'left' });
    pdfDoc.text(`Ime: ${cartData.customerName}`, { align: 'left' });
    pdfDoc.text(`Priimek: ${cartData.customerSurname}`, { align: 'left' });
    pdfDoc.text(`Ulica in hišna številka: ${cartData.customerUlica}`, { align: 'left' });
    pdfDoc.text(`Poštna številka: ${cartData.customerPost}`, { align: 'left' });
    pdfDoc.text(`Mesto: ${cartData.customerCity}`, { align: 'left' });
    pdfDoc.text(`E-naslo: ${cartData.customerEmail}`, { align: 'left' });


    pdfDoc.end();

    // Logic to send email with attachment
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'niko.gorjan@gmail.com',
        pass: 'sgek ixli tqei uato',
      },
    });

    const mailOptions = {
      from: 'niko.gorjan@gmail.com',
      to,
      subject,
      text,
      encoding: 'utf8',
      attachments: [
        {
          filename: 'cartData.pdf',
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully');
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});