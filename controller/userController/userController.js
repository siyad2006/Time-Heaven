const UserDB = require('../../schema/userModel')
const bcrypt = require('bcrypt')
const OTP = require('../../schema/otpverification')
const dotenv = require('dotenv').config()

const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const productDB = require('../../schema/productschema')



const userRegister = async (req, res) => {
    console.log('User registration page accessed successfully.');
    res.render('user/userRegister', { error: req.flash('error') });
}




const postregister = async (req, res) => {
    const { username, Email, password } = req.body;
    console.log(username, Email, password);



    // Check if user already exists
    const exists = await UserDB.findOne({ username: username });
    const mailExists = await UserDB.findOne({ Email: Email });

    if (exists || mailExists) {
        req.flash('error', "the user is already exists")
        console.log('User already exists');
        return res.redirect('/user/register');
    }

    req.session.username = username;
    req.session.Email = Email;
    req.session.password = password;

    const generateNumericOtp = (length = 6) => {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    };


    const otp = generateNumericOtp(6);
    console.log(otp);
    req.session.userOtp = otp
    console.log(req.session)

    try {

        await OTP.create({ Email, otp });


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com',
                pass: 'wlbz xhxj eqyy lvbc'
            }
        });

        // Send OTP email
        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: Email,

            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });

        console.log('OTP sent successfully.');

    } catch (error) {
        console.log('Error sending OTP:', error);
    }


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

    const email = req.session.Email;
    if (!email) {
        console.log('No email found in session.');
        return res.json({ success: false, message: 'No email found in session.' });
    }

    const generateNumericOtp = (length = 6) => {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    };

    const otp = generateNumericOtp(6);
    console.log('Generated OTP:', otp);
    req.session.userOtp = otp;

    try {

        await OTP.create({ Email: email, otp });


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'siyadz4x@gmail.com',
                pass: 'wlbz xhxj eqyy lvbc'
            }
        });


        await transporter.sendMail({
            from: 'siyadz4x@gmail.com',
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP for verification is: ${otp}`
        });

        console.log('OTP resent successfully.');


        res.json({ success: true, message: 'OTP resent successfully.', redirectUrl: '/user/otp' });
    } catch (error) {
        console.log('Error resending OTP:', error);
        res.json({ success: false, message: 'Failed to resend OTP.', error: error.message });
    }
};



const userlogin = async (req, res) => {
    res.render('user/userLogin')
}



const postlogin = async (req, res) => {





    try {
        const { username, Email, password } = req.body

        const name = await UserDB.findOne({ Email })


        console.log(name);

        if (!name) {

            res.json({ success: false, message: 'ithere is no user Exists in this  Email' })
        }


        const cheakpassword = await bcrypt.compare(password, name.password)
        console.log(cheakpassword)

        if (name.username == username) {
            if (cheakpassword) {
                console.warn('user posted')
                if (name.isblocked) {
                    res.json({ success: false, message: 'you are blocked by the admin ' })
                } else {
                    res.json({ success: true, message: 'the message is sucess', redirectUrl: '/user/home' })
                    req.session.loginuser = true
                    console.log('Admin logged in:', req.session.loginuser);

                }

            } else {
                res.json({ success: false, message: 'the password is incorrect' })
            }

        } else {

            res.json({ success: false, message: 'name is incorrect' })
        }
    }

    catch (err) {
        console.log(err);

        console.error('there is no user exists ')
        // res.json({ success: false, message: 'there is no user eixts in the Email ' })
    }

}



const lo = async (req, res) => {
    try {

        const products = await productDB.find({ isblocked: false }).limit(6);
        res.render('user/home', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
};


let productDetails = async (req, res) => {
    const ID = req.params.id;
    const product = await productDB.findById(ID);
    res.render('user/productdetailied', { product });
};


const shoping = async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;


    const products = await productDB.find({ isblocked: false })
        .skip(skip)
        .limit(limit)
        .populate('category')
        .exec();

    const totalProducts = await productDB.countDocuments({ isblocked: false });

    res.render('user/shoping', {
        products,
        currentPage: Number(page),
        totalPages: Math.ceil(totalProducts / limit)
    });
};



module.exports = { postregister, userRegister, otp, otpVerification, resentotp, userlogin, postlogin, lo, productDetails, shoping };
