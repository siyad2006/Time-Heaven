const mongoose=require('mongoose')
const category=require('./category')
const Schema = mongoose.Schema;

const productSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    discription:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "category", // Make sure this matches the model name you want to populate
        required: true
    },
    
    regularprice:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true

    },
    isblocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["available","out of stock"],
        required:true,
        default:"available"
    }
},{timestamps:true}


)

const product= mongoose.model('product',productSchema)

module.exports=product