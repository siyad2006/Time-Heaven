const express = require('express')
const AdminController = require('../../controller/adminController/adminController')
const adminAuth = require('../../middleware/adminAuth')
const productController = require('../../controller/adminController/productController')
const router = express.Router()




const upload = require('../../multer/upload')
const product = require('../../schema/productschema')
router.get('/login', adminAuth.adminLogin, AdminController.login)
router.post('/login', AdminController.postLogin)
router.get('/usermanage', adminAuth.isAdmin, AdminController.usermanage)
router.get('/dashboard', adminAuth.isAdmin, AdminController.dashboard);
router.post('/blockuser/:id', AdminController.blockuser)
router.post('/unblockuser/:id', AdminController.unblockuser)
router.get('/category', adminAuth.isAdmin, AdminController.category)
router.post('/addcategory', AdminController.addcateory)
router.post('/creatcategory', AdminController.creatcategory)
router.post('/blockcategory/:id', AdminController.blockcategory)
router.post('/unblockcategory/:id', AdminController.unblockcategory)
router.post('/editcategory/:id', AdminController.editcategory)
router.post('/:id/categoryedit', AdminController.editing)
router.get('/brand', adminAuth.isAdmin, AdminController.addbrand)
router.post('/postbrand', AdminController.postbrand)
router.post('/getbrand', (req, res) => {
    res.render('admin/addbrand')
})
router.get('/addproduct', adminAuth.isAdmin, productController.addproduct)
router.post('/add', upload, productController.add)
router.get('/products', adminAuth.isAdmin, productController.getproduct)
router.post('/block/:id', productController.blockproduct)
router.post('/unblock/:id', productController.unblockproduct)
// router.delete('/deleteproduct/:id',productController.deleteproduct)
router.post('/deleteproduct/:id', productController.deleteproduct)
router.get('/editproduct/:id', upload, productController.editproduct)
router.post('/Edit/:id', upload, productController.postEdit)
router.get('/logout', AdminController.logout)


module.exports = router