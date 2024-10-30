const UserDB = require('../../schema/userModel')
const bcrypt = require('bcrypt')
const OTP = require('../../schema/otpverification')
const dotenv = require('dotenv').config()

const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const productDB=require('../../schema/productschema')



const userRegister = async (req, res) => {
    console.log('User registration page accessed successfully.');
    res.render('user/userRegister', { error: req.flash('error') });
}




const postregister = async (req, res) => {
    const { username, Email, password } = req.body; // Ensure you access Email with the correct casing
    console.log(username, Email, password);



    // Check if user already exists
    const exists = await UserDB.findOne({ username: username });
    const mailExists = await UserDB.findOne({ Email: Email });

    if (exists || mailExists) {
        req.flash('error', "the user is already exists")
        console.log('User already exists');
        return res.redirect('/user/register'); // Use return to prevent further code execution
    }

    req.session.username = username;
    req.session.Email = Email;
    req.session.password = password;

    // Generate OTP code
    // const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const generateNumericOtp = (length = 6) => {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10); // Generates a random digit (0-9)
        }
        return otp;
    };

    // Usage
    const otp = generateNumericOtp(6); // Generates a 6-digit OTP with only numbers
    console.log(otp);
    req.session.userOtp = otp
    console.log(req.session)

    try {
        // Save OTP to the database
        await OTP.create({ Email, otp }); // Make sure this line is awaited

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com', // Replace with your email
                pass: 'wlbz xhxj eqyy lvbc' // Use an app password or secure your credentials
            }
        });

        // Send OTP email
        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: Email, // Correctly reference the variable with the same case
            //  ithil njan Email ennullath session email aaki
            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });

        console.log('OTP sent successfully.');

    } catch (error) {
        console.log('Error sending OTP:', error);
    }

    // Redirect to OTP verification page
    // res.json({success:true,redirectUrl:'/user/otp'})
    res.redirect('/user/otp');
}




const otp = async (req, res) => {
    console.log('otp page got sucessfully')
    res.render('user/otp')
}


const otpVerification = async (req, res) => {
    console.log('OTP received:', req.body.otp);
    const { otp } = req.body;
    if (req.session.userOtp == otp) {
        console.log('otp verification sucessfull')

        console.log(req.session)
        const username = req.session.username;
        const Email = req.session.Email;
        const localpassword = req.session.password;
        let saltRound = 10
        const password = await bcrypt.hash(localpassword, saltRound)
        console.log(password)
        // req.session.hashedpassword=password
        try {

            const saveUser = new UserDB({
                username,
                Email,
                password
            })

            await saveUser.save()
            res.json({ success: true, message: 'ok success not', redirectUrl: '/user/home' });
        } catch (err) {
            console.log(err)
        }



    } else {
        res.json({ sucess: false, message: 'invalid otp' })
    }



}


const resentotp = async (req, res) => {
    // delete req.session.userOtp
    console.log('Entered to resend OTP');

    const email = req.session.Email; // Get the user's email from the session
    if (!email) {
        console.log('No email found in session.');
        return res.json({ success: false, message: 'No email found in session.' });
    }

    // Generate a new 6-digit OTP
    const generateNumericOtp = (length = 6) => {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10); // Generates a random digit (0-9)
        }
        return otp;
    };

    const otp = generateNumericOtp(6); // Generates a 6-digit OTP
    console.log('Generated OTP:', otp);
    req.session.userOtp = otp; // Store the new OTP in the session

    try {
        // Save the new OTP to the database (you may need to update the existing record)
        await OTP.create({ Email: email, otp }); // Ensure this is awaited

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com', // Replace with your email
                pass: 'wlbz xhxj eqyy lvbc' // Use an app password or secure your credentials
            }
        });

        // Send OTP email
        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: email, // Use the email from the session
            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });

        console.log('OTP resent successfully.');

        // Respond to the client
        res.json({ success: true, message: 'OTP resent successfully.', redirectUrl: '/user/otp' });
    } catch (error) {
        console.log('Error resending OTP:', error);
        res.json({ success: false, message: 'Failed to resend OTP.', error: error.message });
    }
};



const userlogin=async (req,res)=>{
    res.render('user/userLogin')
}



const postlogin=async (req,res)=>{

    
    
    

    try{
        const{username,Email,password}=req.body
        // console.log(username,Email,password)
            const name= await UserDB.findOne({Email})
           

            console.log(name);

            if(!name){
                // console.log('encorrect username or password ')
                res.json({success:false,message:'incorrect username or password'})
            }
            

            const cheakpassword=await bcrypt.compare(password,name.password)
            console.log(cheakpassword)
         
                if(name.username==username){
                    if(cheakpassword){
                        console.warn('user posted')
                        if(name.isblocked){
                            res.json({success:false,message:'you are blocked by the admin '})
                        }else{
                             res.json({success:true,message:'the message is sucess',redirectUrl:'/user/home'})
                             req.session.loginuser=true
                            console.log('Admin logged in:', req.session.loginuser); 

                        }

                    }else{
                        res.json({success:false,message:'the password is incorrect'})
                    }

                }else{
                 
                    res.json({success:false,message:'name is incorrect'})
                }
            }

    catch(err){
       console.log(err);
       
        console.error('there is no user exists ')
    }
    
}

// const lo=async (req,res)=>{
    
//         console.log(req.session)
//         if(req.session.loginuser==true){
//             console.log('entered to here');
            
//             res.redirect('/user/home')
//         }else{
//             res.redirect('/user/login')
//         }
            
//             // res.send('redirected to the home ')
        
// }


// const lo = async (req, res) => {
   
//         const products= await productDB.find().limit(6)
//         res.render('user/home',{products}); 
     
//   };
  
const lo = async (req, res) => {
    try {
        // Find products with isBlocked: false and limit the results to 6
        const products = await productDB.find({ isblocked: false }).limit(6);
        res.render('user/home', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
};


let productDetails = async (req, res) => {
    const ID = req.params.id;
    const product = await productDB.findById(ID); // Removed .limit(1) since findById only returns one document
    res.render('user/productdetailied', { product });
};



module.exports = { postregister, userRegister, otp, otpVerification, resentotp,userlogin ,postlogin,lo,productDetails};
