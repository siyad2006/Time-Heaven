const express = require('express')
const userAuth = require('../../middleware/userAuth')
const userController = require('../../controller/userController/userController');
const router = express.Router()

router.get('/register', userController.userRegister)
router.post('/postregister', userController.postregister)
router.get('/otp', userAuth.isRegistered, userController.otp)
router.get('/login', userController.userlogin)  // , checkLogin , checkLoggedIn
router.post('/userlogin', userController.postlogin)
router.post('/verify-otp', userController.otpVerification);
router.get('/home', userController.lo)
router.post('/resentotp', userController.resentotp)
router.get('/details/:id', userController.productDetails)
router.get('/shop', userController.shoping)
router.get('/demo', userController.demo)
router.get('/logout', userController.logout)
router.get('/profile', userAuth.loginuser, userController.userprofile)
router.get('/editprofile/:id', userAuth.loginuser, userController.editprofile)
router.post('/editprofile/change/:id', userController.updateprofile)
router.get('/changepassword/:id', userController.changepassword)
router.post('/updatepassword/:id',userController.updatepassword)

module.exports = router