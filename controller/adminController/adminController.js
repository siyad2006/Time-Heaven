// const adminDB=require('../../schema/adminModel')
const UserDB=require('../../schema/userModel')
const CategoryDB=require('../../schema/category')
const multer=require('multer')
const BarandModel=require('../../schema/brandModel')
const fs = require('fs');
const path = require('path');
const BrandModel = require('../../schema/brandModel'); // Adjust the path as necessary

const dotenv=require('dotenv').config()


const login=async (req,res)=>{
        
        res.render('admin/adminLogin',{err:req.flash('err')})
    console.log('admin page got sucessfully')
    }
    
    const postLogin = async (req, res) => {
        const { adminname, password } = req.body;
        
        console.log('Admin name:', adminname);
        if (adminname === process.env.ADMIN_NAME && password === process.env.ADMIN_PASSWORD) {
            console.log(adminname)
            req.session.admin = true; 
            console.log('Admin logged in:', req.session.admin); 
            res.redirect('/admin/dashboard');
        } else {

            req.flash('err', 'Login password is incorrect!');
          
            res.redirect('/admin/login')
            
            // return res.status(401).json({ message: 'Login failed' });
        }
    };
    



const usermanage=async (req,res)=>{

    const users=await UserDB.find()
console.warn(users)
res.render('admin/userManage',{users})
}


const dashboard=async (req,res)=>{
    res.render('admin/dashboard')
}

    
const blockuser=async (req,res)=>{
    const val=req.params.id
    console.log(val)

   try{
   await  UserDB.findByIdAndUpdate(val,{isblocked:true})
   res.redirect('/admin/usermanage')
   console.err('user blocked')
   }catch(err){
    console.log(err)
   }
    // console.log(user)
    
}

const unblockuser=async (req,res)=>{
    const val=req.params.id
    console.log(val)

   try{
   await  UserDB.findByIdAndUpdate(val,{isblocked:false})
   console.warn('user inblocked ')
   res.redirect('/admin/usermanage')
   }catch(err){
    console.log(err)
   }
    
}

const category=async (req,res)=>{
        const category= await CategoryDB.find()
        res.render('admin/category',{category})
}

const addcateory=async (req,res)=>{
    res.render('admin/addcategory')
}

const creatcategory=async (req,res)=>{
    const {categoryname,discription}=req.body
    // console.log(categoryname,discription)
    try{
        const category=new CategoryDB({
            categoryname,
            discription
        })

        await category.save()
        res.redirect('/admin/category')
    }catch{
            console.log('an error occured when save category ')
    }
}

const blockcategory=async (req,res)=>{
    // console.log('entered to the blockcategory code ')

    // console.log(req.params.id)

    try{

        let ID=req.params.id
        console.log(ID)

      await  CategoryDB.findByIdAndUpdate(ID,{isblocked:'Unlisted'})

      res.redirect('/admin/category')



    }catch(err){
        console.log('error occured in the code of category blockuing',err)
    }



}

const unblockcategory=async (req,res)=>{
    const ID=req.params.id
    try{

        await  CategoryDB.findByIdAndUpdate(ID,{isblocked:'Listed'})
        res.redirect('/admin/category')

    }catch (err){
        console.log(err);
        
    }

}

const editcategory= async (req,res)=>{

try {
    const ID=req.params.id

    const category=await CategoryDB.findById(ID)

    res.render('admin/editcategory',{category})
} catch (error) {
    console.log(error);
    
}

    

}

const editing=async (req,res)=>{
    const ID=req.params.id
    const categoryname=req.body.categoryname
    const discription=req.body.discription
    await CategoryDB.updateOne({_id:ID},{categoryname:categoryname, discription:discription})

    res.redirect('/admin/category')
}

const addbrand=async (req,res)=>{

    try {
        const brands = await BrandModel.find();
        
        // Convert Buffer to Base64
        const brandsWithImages = brands.map(brand => ({
            ...brand.toObject(),
            logo: `data:${brand.logo.contentType};base64,${brand.logo.data.toString('base64')}`
        }));

        res.render('admin/brand', { brands: brandsWithImages });
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).send('Error fetching brands');
    }

   

    // res.render('admin/brand')

}


// Function to read a file
// const readFile = async (filePath) => {
//     try {
//         return await fs.promises.readFile(filePath);
//     } catch (err) {
//         console.error('Error reading file:', err);
//         throw new Error('File read error');
//     }
// };

// // Function to save a brand
// const saveBrand = async (brandData) => {
//     try {
//         return await brandData.save();
//     } catch (err) {
//         console.error('Error saving brand:', err);
//         throw new Error('Brand save error');
//     }
// };

// Post brand function




// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Use the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original name or customize as needed
    }
});

const upload = multer({ storage: storage }).single('image');


const postbrand = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).send('Error uploading file.');
        }

        // Ensure the file was uploaded
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Path to the uploaded file
        const logoPath = path.join(uploadsDir, req.file.filename);
        console.log('Logo path:', logoPath); // Log for debugging

        // Read the logo file from disk
        let logoData;
        try {
            logoData = await fs.promises.readFile(logoPath);
        } catch (error) {
            console.error('Error reading file:', error);
            return res.status(500).send('Error reading file.');
        }

        const brandname = req.body.brandname;
        console.log('Brand name:', brandname); // Check the value

        // Create a new brand
        const brand = new BrandModel({
            brandname: brandname,
            logo: {
                data: logoData, // This should be a Buffer
                contentType: req.file.mimetype, // Correct content type
            },
        });

        
        try {
            await brand.save();
            console.log('Successfully saved brand');
            res.redirect('/admin/brand')
            // return res.status(201).send('Brand created successfully.');
        } catch (error) {
            console.error('Error saving brand:', error);
            return res.status(500).send('Error saving brand.');
        }
    });
};






module.exports={login,
    postLogin,
    usermanage,
    dashboard,
    blockuser,
    unblockuser,
    category,
    addcateory,
     creatcategory,
     blockcategory,
     unblockcategory,
     editcategory,
     editing,
     addbrand,
     postbrand
    
    }
