
const mongoose=require('mongoose')
// const { Types } = require('mysql')

// const category=new mongoose.Schema({
//     categoryname:{
//         type:String,
//         require:true
//     },
//     discription:{
//         type:String,
//         require:false
//     },
//     isblocked:{
//         type:String,
//         default:'Unlist'
//     }
// })

// const categoryModel= mongoose.model('categoryModel',category)

// module.exports=categoryModel



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

// Register model with the name "category"
const categoryModel = mongoose.model('category', categorySchema);

module.exports = categoryModel;
