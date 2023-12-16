const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },

    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    qty:{
        type:Number,
        requird:true,
    },
    date:{
        type:Date,
        default:()=> new Date(),
    }
})


module.exports = mongoose.model('cart', cartSchema);