const userDB = require('../../schema/userModel')
const cartDB = require('../../schema/cart')
const productDB = require('../../schema/productschema')

// exports.getcart=async (req,res,next)=>{


//     const userid=req.session.userId
//     console.log(userid)

//     const cart=await cartDB.findOne({user:userid})

//     const productids=cart.products.map(product => product.productId);

//     const products=await productDB.find({_id:productids})
//     // console.log(products)

//     res.render('user/cart',{userid,cart,products})
// }


exports.getcart = async (req, res, next) => {
    const userid = req.session.userId;
    console.log(userid);

    const cart = await cartDB.findOne({ user: userid });
    if (!cart || cart.products.length === 0) {
        return res.status(400).send("Cart is empty");
    }

    const cartItems = cart.products.map(product => ({
        productId: product.productId,
        qty: product.qty
    }));
    const products = await productDB.find({ _id: { $in: cartItems.map(item => item.productId) } });

    const cartProducts = products.map(product => {
        const cartItem = cartItems.find(item => item.productId.toString() === product._id.toString());
        return {
            ...product.toObject(),
            qty: cartItem.qty
        };
    });

    res.render('user/cart', { userid, cart, products: cartProducts });
};



exports.addcart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.params.user;
        const { quantity, regularprice } = req.body;
        console.log('Product ID:', productId, 'User ID:', userId, 'Quantity:', quantity, 'Price:', regularprice);


        const existingCart = await cartDB.findOne({ user: userId });

        if (existingCart) {

            const productInCart = existingCart.products.find(item => item.productId.toString() === productId);

            if (productInCart) {

                let newQuantity = productInCart.qty + Number(quantity);


                if (newQuantity > 8) {
                    newQuantity = 8;
                }

                productInCart.qty = newQuantity;


                existingCart.totalAmount = existingCart.products.reduce((total, product) => {
                    return total + (product.qty * regularprice);
                }, 0);

                await existingCart.save();
                console.log('Updated cart:', existingCart);
            } else {

                const finalQuantity = Math.min(Number(quantity), 8);

                existingCart.products.push({
                    productId: productId,
                    qty: finalQuantity
                });

                existingCart.totalAmount += regularprice * finalQuantity;

                await existingCart.save();
                console.log('Added new product to cart:', existingCart);
            }
        } else {

            const finalQuantity = Math.min(Number(quantity), 8);

            const newCart = new cartDB({
                user: userId,
                products: [{
                    productId: productId,
                    qty: finalQuantity
                }],
                totalAmount: regularprice * finalQuantity
            });

            await newCart.save();
            console.log('Created new cart:', newCart);
        }


        res.redirect(`/user/cart/${userId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong');
    }
};


//  exports.updateCart = async (req, res, next) => {
//     const { productId, qty } = req.body;  // Get the product ID and new quantity from the request body
//     const userid = req.session.userId;  // Get the user ID from session

//     // Find the cart for the user
//     const cart = await cartDB.findOne({ user: userid });

//     // Find the specific product in the cart and update the quantity
//     const cartProduct = cart.products.find(product => product.productId.toString() === productId);

//     if (cartProduct) {
//         // Update the quantity in the cart
//         cartProduct.qty = qty;
//     }

//     // Save the updated cart
//     await cart.save();

//     // Fetch the updated product details to calculate the new price
//     const product = await productDB.findById(productId);
//     const updatedPrice = product.regularprice * qty;

//     // Recalculate the total amount for the cart
//     const newTotalAmount = cart.products.reduce((total, product) => {
//         const productDetails = productDB.findById(product.productId);
//         return total + productDetails.regularprice * product.qty;
//     }, 0);

//     // Send the response with updated price and total amount
//     res.json({
//         success: true,
//         updatedPrice: updatedPrice,
//         newTotalAmount: newTotalAmount
//     });
// };


exports.updateCart = async (req, res, next) => {
    const { productId, qty } = req.body;
    const userid = req.session.userId;

    const cart = await cartDB.findOne({ user: userid });
    const cartProduct = cart.products.find(product => product.productId.toString() === productId);

    if (cartProduct) {
        cartProduct.qty = qty;
    }

    const product = await productDB.findById(productId);
    const updatedPrice = product.regularprice * qty;

    let newTotalAmount = 0;
    for (const cartItem of cart.products) {
        const productDetails = await productDB.findById(cartItem.productId);
        newTotalAmount += productDetails.regularprice * cartItem.qty;
    }

    cart.totalAmount = newTotalAmount;
    await cart.save();

    res.json({
        success: true,
        updatedPrice: updatedPrice,
        newTotalAmount: newTotalAmount
    });
};


exports.removecart = async (req, res) => {

    const userid=req.session.userId
    const { productId } = req.body
    console.log(productId)
    
const cartItem=await cartDB.findOne({user:userid})
const item = Array.isArray(cartItem.products) ? cartItem.products.map(x =>({ 
   id: x.productId,
   qty:x.qty
})) : [];

console.log('the item is ',item)
const singleproduct=item.map((i)=>{
    const ismatch=i.id.toString()===productId.toString()
    if(ismatch){
       productId
      
    }
   
})  


    console.log('the output is',singleproduct)
    await cartDB.updateOne(
        {user:userid},{$pull:{products:{productId:productId}}}
    ).then((success)=> console.log('successfully updated')).catch((err)=>console.log(err))

    res.redirect(`/user/cart/${userid}`)

}