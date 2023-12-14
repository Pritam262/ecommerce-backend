const express = require('express');
const cors = require('cors');
const connectToMongo = require('./db');
const path = require('path');
require('dotenv').config()

// Run mongodb connection
connectToMongo();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));
// App route

// User authentication
app.use('/api/auth', require('./routes/auth'));

// Seller authentication

app.use('/api/seller', require('./routes/seller'));

// Product upload // Seller login required

app.use('/api/product', require('./routes/product'))

app.listen(port,()=>{
    console.log(`App running on port number ${port}, URL 127.0.0.1://${port}`);
})
