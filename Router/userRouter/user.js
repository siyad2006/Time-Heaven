const express=require('express')
const userAuth=require('../../middleware/userAuth')
const userController = require('../../controller/userController/userController');
const router=express.Router()
const passport=require('passport')
const productController=require('../../controller/adminController/productController')


router.get('/register',userController.userRegister)
router.post('/postregister',userController.postregister)
router.get('/otp',userAuth.isRegistered,userController.otp)
router.get('/login',userController.userlogin)
router.post('/userlogin',userController.postlogin)
router.post('/verify-otp', userController.otpVerification);
router.get('/home',userController.lo)

router.post('/resentotp',userController.resentotp)
router.get('/details/:id',userController.productDetails)


module.exports=router
