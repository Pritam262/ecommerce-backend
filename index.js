const express = require('express');
const cors = require('cors');
const connectToMongo = require('./db');
require('dotenv').config()

// Run mongodb connection
connectToMongo();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// App route

// User authentication
app.use('/api/auth', require('./routes/auth'));

// Seller authentication

app.use('/api/seller', require('./routes/seller'));

app.listen(port,()=>{
    console.log(`App running on port number ${port}, URL 127.0.0.1://${port}`);
})
