
const cartDB=require('../../schema/cart')
const productDB=require('../../schema/productschema')

exports.getcart=async (req,res)=>{
    res.render('user/cart')
}

// exports.addcart=async (req,res)=>{
//     const ID=req.params.id
//     const user=req.params.user

//  console.log(ID,user)

// const {regularprice,quantity}=req.body;
// console.log(regularprice,quantity)

//     // const cart=new cartDB({
//     //     user:user,
//     //     productid:ID
//     // })

//     // await cart.save()

//     res.redirect(`/user/cart/${user}`);

// }

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

              
                productInCart.qty = newQuantity;

           
                existingCart.totalAmount = existingCart.products.reduce((total, product) => {
                    return total + (product.qty * regularprice);
                }, 0);

                await existingCart.save(); 
                console.log('Updated cart:', existingCart);
            } else {
               
                existingCart.products.push({
                    productId: productId,
                    qty: quantity 
                    });

        
                existingCart.totalAmount += regularprice * quantity;

                await existingCart.save(); 
                console.log('Added new product to cart:', existingCart);
            }
        } else {
          
            const newCart = new cartDB({
                user: userId,
                products: [{
                    productId: productId,
                    qty: quantity 
                }],
                totalAmount: regularprice * quantity 
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
