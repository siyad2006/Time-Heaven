
// const { default: products } = require('razorpay/dist/types/products')
const wishlistDB=require('../../schema/wishlistSchema')


exports.getpage=async (req,res)=>{
    const userid=req.session.userId
    console.log(userid)
    if(!userid){
        return res.redirect('/user/home')
    }
    const userhave=await wishlistDB.findOne({user:userid})
    
    if(userhave){
        
        let page=req.query.page || 0
        let limit=10
        let skip=(page-1)*limit

        const wishlist= await wishlistDB.findOne({user:userid}).populate('products') 
        const totalProducts = await wishlistDB.countDocuments({ user: userid });
        const totalPages = Math.ceil(totalProducts / limit);

        if (!wishlist.products || wishlist.products.length === 0) {
            return res.render('user/emptyWishlist'); // Render Empty Wishlist page
        }
        return  res.render('user/wishlist',{wishlist,userid,currentPage: page,totalPages});
    }else{
      
      return res.render('user/emptyWishlist');
    }
    
}


 


exports.additem = async (req, res) => {
    const ID = req.body.productId;
    const userid = req.session.userId;

    if (!userid) {
        console.log('Session userId is undefined. User needs to log in.');
        return res.status(401).send('Login first');
    }

    try {
        const userWishlist = await wishlistDB.findOne({ user: userid });

        if (userWishlist) { 
            const productExists = await wishlistDB.findOne({ user: userid, products: ID });
            if (productExists) {
                console.log('Product already in wishlist');
                return res.json({ success: false, message: 'Product already in wishlist' });
            }
 
            await wishlistDB.updateOne(
                { user: userid },
                { $addToSet: { products: ID } }
            );
            console.log('Successfully added product to wishlist');
            return res.json({ success: true });
        } 
        const newWishlist = new wishlistDB({ user: userid, products: [ID] });
        await newWishlist.save();
        console.log('New wishlist created and product added');
        return res.json({ success: true });
    } catch (err) {
        console.error('Error handling wishlist operation:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};


exports.delete= async (req,res)=>{
    console.log(req.params.id)
    const userid=req.session.userId
    const ID=req.params.id
    await wishlistDB.updateOne({user:userid},{$pull:{products:ID}}).then(()=> console.log('pulled successfuly '))
    res.redirect('/user/wishlist')
}