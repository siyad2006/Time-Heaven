const express=require('express')
const app=express()
const path=require('path')
const cors = require("cors");
const userRouter=require('./Router/userRouter/user');
const adminRouter=require('./Router/adminRouter/admin')
const flash = require('connect-flash');
const nocache=require('nocache')
const swal=require('sweetalert2')
const passport=require('./config/passport')
const multer=require('multer')
const methodOverride = require('method-override');
// const otpGenerator=require('otp-generator')
// const modemailer=require('nodemailer')
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



// app.use(swal())
// const { log } = require('console');
const session = require('express-session');
const mongoose=require('mongoose')
require('dotenv').config();




// app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
// app.use(express.json()); 
app.use(nocache())

// app.use('/uploads', express.static('path/to/uploads'));
// app.use('./uploads', express.static('uploads'));
// app.use('./uploads', express.static('uploads'));
app.use('/uploads', express.static('uploads'));


const mongoConnect=process.env.MONGO_URI
// middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(cors());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour
}));

app.use(flash())

app.use(passport.initialize())
app.use(passport.session())


// Set up 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// mongodb connect
try{
    mongoose.connect(mongoConnect, {
})
console.log('mongodb connected successfully');


}catch(err){
    console.log(err);
    
}

app.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
app.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/user/register'}),(req,res)=>{
    res.redirect('/user/home')
})

// app.use('/auth',authRouter)
app.use('/user',userRouter)
app.use('/admin',adminRouter)


// app.use((err,req,res)=>{
//     console.log(err);
//     console.log('en error occured in the code ');
    

// })
// (function(req,res){
// console.log(req.session.Email)
// }())

app.listen(3000,()=>{
    console.log('server runned sucessfullly ');
    
})