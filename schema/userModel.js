// const mongoose=require('mongoose')

// const UserSchema= new mongoose.model({
//     username:{
//         type:String,
//         required:true
//     },
//     email:{
//         type:String,
//         required:true
//     },
//     password:{
//         type:String,
//         required:true
//     },
//     isblocked:{
//         type:Boolean,
//         default:false
//     }
// })


// // const User=mongoose.model('user',UserSchema)
// // module.exports=User

// const User = mongoose.model('User', UserSchema);

// module.exports = User;
const mongoose = require('mongoose');

// Define the schema using mongoose.Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required:false
    },
    isblocked: {
        type: Boolean,
        default: false
    },
    // googleId:{
    //     type:String,
    //     // unique:true,
    //     required:false
    // }
    googleId: {
        type: String,
        unique: false,  // Set to false or simply remove this line
        required: false // Keep this if googleId is optional
    }
    
   
});

// Create the model using mongoose.model
const User = mongoose.model('User', UserSchema);

module.exports = User;
