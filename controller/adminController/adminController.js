const UserDB = require('../../schema/userModel')
const CategoryDB = require('../../schema/category')
const multer = require('multer')
const BarandModel = require('../../schema/brandModel')
const fs = require('fs');
const path = require('path');
const BrandModel = require('../../schema/brandModel');
const dotenv = require('dotenv').config()

// admin login
const login = async (req, res) => {

    res.render('admin/adminLogin', { err: req.flash('err') })
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


    }
};



// user manage 
const usermanage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await UserDB.countDocuments();
    const users = await UserDB.find().skip(skip).limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render('admin/usermanage', {
        users,
        page,
        totalPages,
    })
}

// for get dashboard
const dashboard = async (req, res) => {
    res.render('admin/dashboard')
}


// for block user 
const blockuser = async (req, res) => {
    const val = req.params.id
    console.log(val)

    try {
        await UserDB.findByIdAndUpdate(val, { isblocked: true })
        res.redirect('/admin/usermanage')
        console.err('user blocked')
    } catch (err) {
        console.log(err)
    }


}



// for ubblock user
const unblockuser = async (req, res) => {
    const val = req.params.id
    console.log(val)

    try {
        await UserDB.findByIdAndUpdate(val, { isblocked: false })
        console.warn('user inblocked ')
        res.redirect('/admin/usermanage')
    } catch (err) {
        console.log(err)
    }

}


// for get catrgory page 
const category = async (req, res) => {
    const category = await CategoryDB.find()
    res.render('admin/category', { category })
}


// for add category
const addcateory = async (req, res) => {
    res.render('admin/addcategory')
}


// create a new category
const creatcategory = async (req, res) => {
    const { categoryname, discription } = req.body

    const cheack = await CategoryDB.findOne({ categoryname: categoryname })

    if (cheack) {
        res.redirect('/admin/category')
        req.flash('category_err', 'the category name is already exists ')
        console.log(req.flash('category_err'));
    } else {



        try {
            const category = new CategoryDB({
                categoryname,
                discription
            })

            await category.save()
            res.redirect('/admin/category')
            req.flash('success_msg', 'saved sucessfully')
        } catch {
            console.log('an error occured when save category ')
        }
    }
}


// for List category
const blockcategory = async (req, res) => {


    try {

        let ID = req.params.id
        console.log(ID)

        await CategoryDB.findByIdAndUpdate(ID, { isblocked: 'Unlisted' })

        res.redirect('/admin/category')



    } catch (err) {
        console.log('error occured in the code of category blockuing', err)
    }



}



// for unlist category
const unblockcategory = async (req, res) => {
    const ID = req.params.id
    try {

        await CategoryDB.findByIdAndUpdate(ID, { isblocked: 'Listed' })
        res.redirect('/admin/category')

    } catch (err) {
        console.log(err);

    }

}


// for edit category
const editcategory = async (req, res) => {

    try {
        const ID = req.params.id

        const category = await CategoryDB.findById(ID)

        res.render('admin/editcategory', { category })
    } catch (error) {
        console.log(error);

    }



}



// Edit category
const editing = async (req, res) => {
    const ID = req.params.id
    const categoryname = req.body.categoryname
    const discription = req.body.discription
    await CategoryDB.updateOne({ _id: ID }, { categoryname: categoryname, discription: discription })

    res.redirect('/admin/category')
}

const addbrand = async (req, res) => {

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





}





const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).single('image');


const postbrand = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).send('Error uploading file.');
        }


        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }


        const logoPath = path.join(uploadsDir, req.file.filename);
        console.log('Logo path:', logoPath);


        let logoData;
        try {
            logoData = await fs.promises.readFile(logoPath);
        } catch (error) {
            console.error('Error reading file:', error);
            return res.status(500).send('Error reading file.');
        }

        const brandname = req.body.brandname;
        console.log('Brand name:', brandname);


        const brand = new BrandModel({
            brandname: brandname,
            logo: {
                data: logoData,
                contentType: req.file.mimetype,
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






module.exports = {
    login,
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
