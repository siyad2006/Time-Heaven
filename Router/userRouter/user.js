const express = require('express')
const userAuth = require('../../middleware/userAuth')
const userController = require('../../controller/userController/userController');
const router = express.Router()
const cartController = require('../../controller/userController/cartController')
const cheackout=require('../../controller/userController/cheakoutController')

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
router.get('/changepassword/:id', userAuth.loginuser, userController.changepassword)
router.post('/updatepassword/:id', userController.updatepassword)
router.get('/address/:id', userController.address);
router.post('/createaddress/:id', userController.createaddress);
router.post('/deleteaddress/:id/:user', userController.deleteaddress);
router.get('/updateaddress/:id/:user', userController.updateaddress);
router.post('/postchange/:id/:user', userController.updatingAddress);
router.get('/cart/:user', userAuth.loginuser,cartController.getcart);
router.post('/addcart/:id/:user',cartController.addcart);
router.post('/cart/update', cartController.updateCart);
router.post('/cart/remove',cartController.removecart);
// router.get('/cheakout',(req,res)=>{
//     res.render('user/cheakout')
// })

// router.post('/cheackout/:cart',cheackout.getcheackout)
router.post('/checkout/:cart', cheackout.getcheackout); 

router.post('/placeorder/:user',cheackout.placeorder)
router.get('/myorders/:user',cheackout.myorders)
router.post('/cancelorder/:id',cheackout.cancelorder)
router.get('/success',cheackout.success)

module.exports = router