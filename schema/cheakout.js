
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const cheakoutSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethods: {
        type: String,
        enum: ['cod', 'paypal'],
        required: true
    },
    totalprice: {
        type: Number,
        required: false
    },
    products: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            qty:{
                type:Number,
                required:true
            }
         
        }
    ],
    status: {
        type: String,
        enum:['pending','shipping','delivered','canceled'],
        required: true
    },
    address: {
        
      
        name: {
            type: String,
            require: true
        },
        phone: {
            type: Number,
            require: true
        },
        houseAddress: {
            type: String,
            require: true
        },
        city: {
            type: String,
            require: true
        },
        state: {
            type: String,
            require: true
        },
        pincode: {
            type: Number,
            require: true
        },
        country: {
            type: String,
            require: true
        }
        
    }
    // orderId:{
    //     type:String,
    //     require:true
    // }

}, { timestamps: true })



const cheakout = mongoose.model('cheakout', cheakoutSchema)

module.exports = cheakout
