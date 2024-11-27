
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
        
        const wishlist= await wishlistDB.findOne({user:userid}).populate('products')
        // res.json(wishlist)
        if (!wishlist.products || wishlist.products.length === 0) {
            return res.render('user/emptyWishlist'); // Render Empty Wishlist page
        }
        return  res.render('user/wishlist',{wishlist,userid});
    }else{
      
      return res.render('user/emptyWishlist');
    }
    
}

exports.additem= async (req,res)=>{
    const ID=req.body.productId
    const userid=req.session.userId
    // const userid=req.session.userId
    console.log(userid)
    
    if(userid==undefined){
        console.log('entered to debug code ')
        return res.status(404).send('login first ')
    }

    console.log('entered to the add code ')
    const userhave=await wishlistDB.findOne({user:userid})
    if(userhave){
        console.log('entered to the edit code ')
        //   res.render('user/wishlist')
        const wishlist=await wishlistDB.findOne({products:ID})
        if(wishlist){
            console.log('entered to the repeatationi code ')
            return res.json({success:false})
        }else{
             await wishlistDB.updateOne({user:userid},{$push:{products:ID}}).then(()=>console.log('succesfully addded ')).catch((err)=>console.log(err))
        res.json({sucess:true})
        }
        
       
    }else{
      console.log('ented to the new code ')
        const newwishlist= new wishlistDB({
            user:userid,
            products:ID
        })
        await newwishlist.save()
        res.json({success:true})
        // res.status(200).send('wishlist not found')
    }
}

exports.delete= async (req,res)=>{
    console.log(req.params.id)
    const userid=req.session.userId
    const ID=req.params.id
    await wishlistDB.updateOne({user:userid},{$pull:{products:ID}}).then(()=> console.log('pulled successfuly '))
    res.redirect('/user/wishlist')
}