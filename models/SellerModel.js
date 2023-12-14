const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    sellername: {
        type: String,
        required: true,
        unique:true,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
    },
    pin: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    date: {
        type: Date,
        default: () => new Date(), //set the default value to the current UTC time
    }
});


module.exports = mongoose.model('Seller', userSchema)