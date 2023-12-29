const mongoose = require('mongoose');


const addressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    addressline: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    pinCode: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    stateName: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    landmark: {
        type: String,
    },

})


module.exports = mongoose.model('Address', addressSchema)