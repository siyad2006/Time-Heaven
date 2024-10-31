const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    categoryname: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        required: false
    },
    isblocked: {
        type: String,
        default: 'Unlist'
    }
});


const categoryModel = mongoose.model('category', categorySchema);

module.exports = categoryModel;
