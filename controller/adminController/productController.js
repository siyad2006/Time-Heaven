const fs = require('fs');
const path = require('path');
const multer = require('multer')
const productDB = require('../../schema/productschema')
const category = require('../../schema/category');
const product = require('../../schema/productschema');


const addproduct = async (req, res) => {

    const categoris = await category.find()

    res.render('admin/addproduct', { categoris })
}



const add = async (req, res) => {
    const val = req.body;
        console.log(val.regularprice)

    const imagePaths = [];

    if (req.files) {

        if (req.files.image1) {
            imagePaths.push(req.files.image1[0].path);
            if (req.files.image2) {
                imagePaths.push(req.files.image2[0].path);
            }
            if (req.files.image3) {
                imagePaths.push(req.files.image3[0].path);
            }
        }

        const newProduct = new productDB({
            name: val.productname.trim(),
            discription: val.discription.trim(),
            brand: val.brand.trim(),
            category: val.category,
            regularprice: val.regularprice,
            quantity: val.quantity,
            color: val.color.trim(),
            image: imagePaths,
            status: val.status || "available"
        });


        await newProduct.save();


        res.redirect('/admin/products');
    };


}
    const postEdit = async (req, res) => {
        const productId = req.params.id;
        const val = req.body;
        const imagePaths = [];


        if (req.files) {
            if (req.files.image1) {
                imagePaths.push(req.files.image1[0].path);
            }
            if (req.files.image2) {
                imagePaths.push(req.files.image2[0].path);
            }
            if (req.files.image3) {
                imagePaths.push(req.files.image3[0].path);
            }
        }

        try {

            const existingProduct = await productDB.findById(productId);


            if (imagePaths.length > 0) {
                existingProduct.image.forEach((oldImagePath) => {
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.log(`Failed to delete old image at ${oldImagePath}: `, err);
                    });
                });
            }


            await productDB.findByIdAndUpdate(
                productId,
                {
                    name: val.productname.trim(),
                    discription: val.discription.trim(),
                    brand: val.brand.trim(),
                    category: val.category,
                    regularprice: val.regularprice,
                    quantity: val.quantity,
                    color: val.color.trim(),
                    image: imagePaths.length > 0 ? imagePaths : existingProduct.image,
                    status: val.status || "available"
                },
                { new: true }
            );

            res.redirect('/admin/products');
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).send('Failed to edit product. Please try again.');
        }
    };










    const getproduct = async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        try {
            const products = await productDB.find().populate('category').skip(skip).limit(limit);
            const totalProducts = await productDB.countDocuments();
            const totalPages = Math.ceil(totalProducts / limit);
            res.render('admin/product', {
                products,
                currentPage: page,
                totalPages
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching products");
        }
    };



    const blockproduct = async (req, res) => {
        try {
            const ID = req.params.id
            await productDB.findByIdAndUpdate({ _id: ID }, { isblocked: true })
            res.redirect('/admin/products')
        } catch (err) {
            console.log(err)
        }
    }

    const unblockproduct = async (req, res) => {
        try {
            const ID = req.params.id
            await productDB.findByIdAndUpdate({ _id: ID }, { isblocked: false })
            res.redirect('/admin/products')

        } catch (error) {
            console.log(error);

        }
    }

    const deleteproduct = async (req, res) => {
        try {

            const ID = req.params.id
            await productDB.findByIdAndDelete(ID)
            res.redirect('/admin/products')

        } catch {
            console.log('an error occured wilte delete product ');

        }
    }



    const editproduct = async (req, res) => {
        const ID = req.params.id
        const product = await productDB.findById(ID)
        const categoris = await category.find()
        res.render('admin/editproduct', { product, categoris })
    }

    module.exports = { addproduct, add, getproduct, blockproduct, unblockproduct, deleteproduct, editproduct, postEdit }