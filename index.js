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
    host: 'jashabrewing.com',
    port: 465,
    secure: true,
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

app.get('/CustomerData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM Customers', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/PhoneData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM Phone', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/PubData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM PubImages', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/BreweryData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM BreweryImages', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/LockData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM LockData', (queryError, results) => {
    if (queryError) {
      console.error('Error executing query:', queryError);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the query results as JSON
    res.json(results);
  });
});

app.get('/shippingTresholdData', (req, res) => {
  // Perform database query
  connection.query('SELECT * FROM ShippingTreshold', (queryError, results) => {
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
        cena,
        navoljo,
        enote,
        enoteSkupaj
      } = item;

      const insertItemQuery = 'INSERT INTO Items (ime, podnaslov, opisslo, opiseng, popust, slika, category, cena,navoljo,enote,enoteSkupaj) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?)';

      // Convert Buffer data to Buffer
      const slikaBuffer = Buffer.from(slika.data);

      connection.query(insertItemQuery, [ime, podnaslov, opisslo, opiseng, popust, slikaBuffer, category, cena,navoljo,enote,enoteSkupaj], (queryError, results) => {
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
      host: 'jashabrewing.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
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

app.post('/update-customer', async (req, res) => {
  try {
    const { email, name, surname, phone, price } = req.body;

    // Check if the customer already exists
    const customerExistsQuery = 'SELECT * FROM Customers WHERE email = ?';
    connection.query(customerExistsQuery, [email], async (queryError, results) => {
      if (queryError) {
        console.error('Error checking if customer exists:', queryError);
        res.status(500).send('Internal Server Error');
        return;
      }

      if (results.length > 0) {
        // Customer exists, update spending
        const updateCustomerQuery = 'UPDATE Customers SET spending = spending + ? WHERE email = ?';
        connection.query(updateCustomerQuery, [price, email], (updateError) => {
          if (updateError) {
            console.error('Error updating customer spending:', updateError);
            res.status(500).send('Internal Server Error');
          } else {
            res.status(200).send('Customer data updated successfully');
          }
        });
      } else {
        // Customer doesn't exist, insert a new row
        const insertCustomerQuery = 'INSERT INTO Customers (name, surname, email, phone, spending) VALUES (?, ?, ?, ?, ?)';
        connection.query(insertCustomerQuery, [name, surname, email, phone, price], (insertError) => {
          if (insertError) {
            console.error('Error inserting new customer:', insertError);
            res.status(500).send('Internal Server Error');
          } else {
            res.status(200).send('New customer added successfully');
          }
        });
      }
    });
  } catch (error) {
    console.error('Error updating customer data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/UpdateShippingValue', (req, res) => {
  const { idDostava, value } = req.body;

  // Update the Shipping table where idDosta is the specified ID
  const updateShippingValueQuery = 'UPDATE Shipping SET value = ? WHERE idDostava = ?';

  connection.query(updateShippingValueQuery, [value, idDostava], (queryError, results) => {
    if (queryError) {
      console.error('Error updating shipping value:', queryError);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('Shipping value updated successfully');
    }
  });
});

app.post('/UpdateShippingTresholdValue', (req, res) => {
  const { idShippingTreshold, treshold } = req.body;

  // Update the Shipping table where idDosta is the specified ID
  const updateShippingValueQuery = 'UPDATE ShippingTreshold SET treshold = ? WHERE idShippingTreshold = ?';

  connection.query(updateShippingValueQuery, [treshold, idShippingTreshold], (queryError, results) => {
    if (queryError) {
      console.error('Error updating shipping value:', queryError);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('Shipping value updated successfully');
    }
  });
});

app.post('/UpdatePhoneValue', async (req, res) => {
  try {
    const { idTelefon, mobile, phone } = req.body;

    // Update the Phone table where idTelefon is 1
    const updatePhoneQuery = 'UPDATE Phone SET mobile = ?, phone = ? WHERE idTelefon = ?';
    connection.query(updatePhoneQuery, [mobile, phone, idTelefon], (updateError) => {
      if (updateError) {
        console.error('Error updating phone values:', updateError);
        res.status(500).send('Internal Server Error');
      } else {
        res.status(200).send('Phone values updated successfully');
      }
    });
  } catch (error) {
    console.error('Error updating phone values:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/UpdatePubImagesValues', async (req, res) => {
  try {
      const { idPubPhotos, images } = req.body;

      const pubImagesData = images[0];

      const slikaBuffer1 = pubImagesData.image1 ? Buffer.from(pubImagesData.image1.data) : null;
      const slikaBuffer2 = pubImagesData.image2 ? Buffer.from(pubImagesData.image2.data) : null;
      const slikaBuffer3 = pubImagesData.image3 ? Buffer.from(pubImagesData.image3.data) : null;

      const updatePubImagesQuery = 'UPDATE PubImages SET image1 = ?, image2 = ?, image3 = ? WHERE idPubPhotos = ?';

      // Execute the query
      connection.query(updatePubImagesQuery, [slikaBuffer1, slikaBuffer2, slikaBuffer3, idPubPhotos], (queryError) => {
          if (queryError) {
              console.error('Error updating PubImages:', queryError);
              res.status(500).send('Internal Server Error');
          } else {
              res.status(200).send('PubImages data updated successfully');
          }
      });
  } catch (error) {
      console.error('Error updating PubImages data:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/UpdateBreweryImagesValues', async (req, res) => {
  try {
      const { idBreweryImages, images } = req.body;

      const pubImagesData = images[0];

      const slikaBuffer1 = pubImagesData.image1 ? Buffer.from(pubImagesData.image1.data) : null;
      const slikaBuffer2 = pubImagesData.image2 ? Buffer.from(pubImagesData.image2.data) : null;
      const slikaBuffer3 = pubImagesData.image3 ? Buffer.from(pubImagesData.image3.data) : null;

      const updatePubImagesQuery = 'UPDATE BreweryImages SET image1 = ?, image2 = ?, image3 = ? WHERE idBreweryImages = ?';

      // Execute the query
      connection.query(updatePubImagesQuery, [slikaBuffer1, slikaBuffer2, slikaBuffer3, idBreweryImages], (queryError) => {
          if (queryError) {
              console.error('Error updating PubImages:', queryError);
              res.status(500).send('Internal Server Error');
          } else {
              res.status(200).send('PubImages data updated successfully');
          }
      });
  } catch (error) {
      console.error('Error updating PubImages data:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/UpdateLockValues', (req, res) => {
  try {
    const { idLock, locked } = req.body;

    // Perform an update query based on the locked value
    const updateLockQuery = 'UPDATE LockData SET locked = ? WHERE idLock = ?';
    connection.query(updateLockQuery, [locked ? 1 : 0, idLock], (updateError) => {
      if (updateError) {
        console.error('Error updating LockData:', updateError);
        res.status(500).send('Internal Server Error');
      } else {
        res.status(200).send('Lock status updated successfully');
      }
    });
  } catch (error) {
    console.error('Error updating LockData:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/update-items-enote', async (req, res) => {
  const itemsDatabase = req.body.itemsDatabase;

  try {
    // Loop through itemsDatabase and update records in the database
    for (const item of itemsDatabase) {
      const updateQuery = 'UPDATE Items SET cena = ?, enote = ? WHERE ime = ?';
      const values = [item.cena, item.enote, item.ime];

      await executeQuery(updateQuery, values);
    }

    res.status(200).send('Items enote updated successfully');
  } catch (error) {
    console.error('Error updating items enote:', error);
    res.status(500).send('Internal Server Error');
  }
});

const executeQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

app.post('/check-and-send-email', async (req, res) => {
  try {
    const { itemsDatabase } = req.body;

    // Find items with enote less than "50"
    const itemsToAlert = itemsDatabase.filter(item => parseFloat(item.enote) < 50 && item.enoteSkupaj === 1 && item.navoljo === 1);

    // If there are items to alert, send an email
    if (itemsToAlert.length > 0) {
      const subject = 'OPOZORILO';
      let text = 'Izdelek z manj kot 50 enot:\n';

      // Append item details to the email text
      itemsToAlert.forEach(item => {
        text += `Ime: ${item.ime}, Enote: ${item.enote}\n`;
      });

      // Send email
      await sendEmail(process.env.EMAIL_USERNAME, subject, text);

      console.log('Alert email sent successfully');
    }

    res.status(200).send('Emails sent successfully');
  } catch (error) {
    console.error('Error checking and sending emails:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});