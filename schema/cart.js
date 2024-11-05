const mongoose = require('mongoose');
// const productDB = require('./productschema');

const Schema = mongoose.Schema;


const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [ // Changed from productid to products for clarity
        {
            productId: { // Changed to productId for better clarity
                type: Schema.Types.ObjectId,
                ref: 'Product', // Ensure this matches the correct product model name
                required: true
            },
            qty: {
                type: Number,
                required: false, // Changed to true as qty should be required
                min: 1 // Ensures the quantity is at least 1
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: false,
        default: 0 // Optional: You might want to set a default value
    }
}, { timestamps: true });

const cart = mongoose.model('cart', cartSchema)

module.exports = cart