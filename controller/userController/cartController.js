
const cartDB=require('../../schema/cart')
const productDB=require('../../schema/productschema')

exports.getcart=async (req,res)=>{
    res.render('user/cart')
}

exports.addcart=async (req,res)=>{
    const ID=req.params.id
    const user=req.params.user

//  console.log(ID,user)

    const cart=new cartDB({
        user:user,
        productid:ID
    })

    await cart.save()

    res.redirect(`/user/cart/${user}`);

}

 // Ensure to require the product model

// exports.addcart = async (req, res) => {
//     const productId = req.params.id; 
//     const userId = req.params.user; // Get user ID from the route parameter

//     try {
//         // Check if the cart already exists for the user
//         let cart = await cartDB.findOne({ user: userId });

//         // If the cart doesn't exist, create a new one
//         if (!cart) {
//             cart = new cartDB({
//                 user: userId,
//                 products: [] // Start with an empty products array
//             });
//         }

//         // Check if the product is already in the cart
//         const existingProduct = cart.products.find(item => item.productId.toString() === productId);

//         if (existingProduct) {
//             // If the product exists, increment the quantity
//             existingProduct.qty += 1; // You can modify this logic to set it as needed
//         } else {
          
//             cart.products.push({
//                 productId: productId,
//                 qty: 1 
//             });
//         }

        
//         const product = await productDB.findById(productId);
//         if (product) {
//             cart.totalAmount += product.price; // Assuming product has a price field
//         }

//         // Save the cart
//         await cart.save();

//         // Redirect to the user's cart page
//         res.redirect(`/user/cart/${userId}`);
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };
