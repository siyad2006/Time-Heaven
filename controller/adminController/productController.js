const fs = require('fs');
const path = require('path');
const multer=require('multer')
const productDB=require('../../schema/productschema')
const category=require('../../schema/category');
const product = require('../../schema/productschema');


const addproduct=async (req,res)=>{

    const categoris= await category.find()

    res.render('admin/addproduct',{categoris})
}

const add=  async (req,res)=>{
    const val=req.body
 
    // console.log(req.files); 

const imagePaths= req.files.image.map(file=> file.path)
// console.log(filepaths)
// const imagePaths=req.files

const newProduct = new productDB({
    name: val.productname,
    discription: val.discription,
    brand: val.brand,
    category: val.category, 
    regularprice: val.regularprice,
    quantity: val.quantity,
    color: val.color,
    image: imagePaths,
    status: val.status || "available" 
});
await newProduct.save();


res.redirect('/admin/products');

}

// const getproduct=async (req,res)=>{

//     const product= await productDB.find().populate('category');
//     console.log(product)

//     res.render('admin/product',{product});

// }
const getproduct = async (req, res) => {
    const products = await productDB.find().populate('category');
    console.log(products);

    
    res.render('admin/product', { products });
};

const blockproduct= async (req,res)=>{
    try{
        const ID=req.params.id
        await productDB.findByIdAndUpdate({_id:ID},{isblocked:true})
        res.redirect('/admin/products')
    }catch(err){
        console.log(err)
    }
}

const unblockproduct= async (req,res)=>{
    try {
        const ID=req.params.id
        await productDB.findByIdAndUpdate({_id:ID},{isblocked:false})
        res.redirect('/admin/products')

    } catch (error) {
        console.log(error);
        
    }
}

const deleteproduct= async (req,res)=>{
    try{

        const  ID=req.params.id
        await productDB.findByIdAndDelete(ID)
        res.redirect('/admin/products')

    }catch{
        console.log('an error occured wilte delete product ');
        
    }
}

// let productDetails = async (req,res)=>{
    
//     const ID=req.params.id
//       const product=  await productDB.findById (ID).limit(1)
//     res.render('user/productdetailied',{product})

// }

// productController.js

// Export the function
// module.exports = { productDetails };


module.exports={addproduct,add,getproduct,blockproduct,unblockproduct,deleteproduct}