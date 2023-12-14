const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Sheller',
//     },
//     productType: {
//         type: String,
//         required: true,
//     },
//     imageUrl: {
//         type: String,
//         required: true,
//     },
//     title: {
//         type: String,
//         required: true,
//     },
//     description: {
//         type: String,
//         required: true,
//     },
//     qty: {
//         type: Number,
//         required: true,
//     },
//     price: {
//         type: Number,
//         required: true,
//     },
//     size: {
//         type: String,
//     },
//     color: {
//         type: String,
//         required: true,
//     },
//     date: {
//         type: Date,
//         default: () => new Date(),
//     },
//     // Other specific fields for different product types can be added here
// });

// module.exports = mongoose.model('Product', productSchema);


const productSchema = new mongoose.Schema({
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },
    productType: {
      type: String,
      required: true,
    },
    images: [{ // Array of objects containing filename and path
      filename: String,
      path: String,
    }],
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
    },
    color: {
      type: String,
    },
    date: {
      type: Date,
      default: () => new Date(),
    },
    // Other specific fields for different product types can be added here
  });
  
  module.exports = mongoose.model('Product', productSchema);


