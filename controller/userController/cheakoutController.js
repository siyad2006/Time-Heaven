const cartDB = require('../../schema/cart')
const checkoutDB = require('../../schema/cheakout')
const productDB = require('../../schema/productschema')
const AddressDB = require('../../schema/address')


exports.getcheackout = async (req, res) => {
    const cartId = req.params.cart;
    const userId = req.session.userId;

    const cartItem = await cartDB.findById(cartId);
    const address = await AddressDB.find({ user: userId });

    const cartProducts = cartItem.products.map(product => ({
        productId: product.productId,
        qty: product.qty
    }));

    const products = await productDB.find({ _id: { $in: cartProducts.map(item => item.productId) } });

    const cartProductDetails = products.map(product => {
        const cartProduct = cartProducts.find(item => item.productId.toString() === product._id.toString());
        return {
            ...product.toObject(),
            qty: cartProduct.qty
        };
    });

    console.log(cartProductDetails)
    res.render('user/cheakout', { cartProducts: cartProductDetails, address, userId, cartItem });
};


exports.placeorder = async (req, res) => {
    const user = req.params.user;
    console.log('this is the user id from checkout', user);

    const { name, phone, street, city, state, postalCode, paymentMethod, products,country } = req.body;
    console.log(name, phone, street, city, state, postalCode, paymentMethod, products);

    try {

        // const productsDetails = await productDB.find({
        //     '_id': { $in: products.map(product => product.productId) }
        // });
        // console.log(productsDetails)

            const cart= await cartDB.findOne({user:user})
            const total=cart.totalAmount
            console.log(cart)
            if (!cart || cart.products.length === 0) {
                return res.status(400).send("Cart is empty");
              }
            //   address={n}
            //   name: {
            //     type: String,
            //     require: true
            // },
            // phone: {
            //     type: Number,
            //     require: true
            // },
            // houseAddress: {
            //     type: String,
            //     require: true
            // },
            // city: {
            //     type: String,
            //     require: true
            // },
            // state: {
            //     type: String,
            //     require: true
            // },
            // pincode: {
            //     type: Number,
            //     require: true
            // },
            // country: {
            //     type: String,
            //     require: true
            // }
                const items=cart.products.map(x=>({
                    productId:x._id,
                    qty:x.qty
                }))
                console.log(items)
                const order= new checkoutDB({
                    userID:user,
                    paymentMethods:paymentMethod,
                    totalprice:total,
                    products:items,
                    status:'pending',
                    address:{
                       name:name,
                       phone:phone,
                       houseAddress:street,
                       city:city,
                       state:state,
                       pincode:postalCode,
                       country:country
                    }
                })
                await order.save()
                await cartDB.findOneAndDelete({ user: user });
                res.json({ success: true });            
    }catch (error){
        console.log(error)
    }

};

// this code will helpfull in adminside 
exports.myorders= async (req,res)=>{
    const cart=await cartDB.findOne({user:req.params.user})
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
console.log(cartProducts)

    res.render('user/myorder')
}

// exports.myorders = async (req, res) => {
//     try {
//         const userId = req.params.user;  // Retrieve user ID from request parameters
//         console.log('User ID:', userId);

//         // Fetch the order document for the user from checkoutDB
//         const orders = await checkoutDB.findOne({ userID: userId });
//         if (!orders) {
//             console.log('No orders found for this user');
//             return res.status(404).send('No orders found for this user');
//         }
//         console.log('Orders:', orders);

//         const productIds = orders.products.map(item => item.productId);
//         console.log('Product IDs from Order:', productIds);

//         const mongoose = require('mongoose');
//         const matchingProducts = await productDB.find({ _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } });
//         console.log('Matching Products:', matchingProducts);

//         res.render('user/myorder', { matchingProducts });
//     } catch (error) {
//         console.error('Error fetching orders:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };


// exports.placeorder = async (req, res) => {
//     const user = req.params.user;  // Assuming user ID is passed in the URL
//     console.log('This is the user ID from checkout:', user);

//     const { name, phone, street, city, state, postalCode, country, paymentMethod, products } = req.body;
//     console.log(name, phone, street, city, state, postalCode, country, paymentMethod, products);

//     try {
//         // Fetch product details based on productId from the products array
//         const productDetails = await productDB.find({
//             '_id': { $in: products.map(product => product.productId) }
//         });

//         // Initialize total price calculation
//         let totalPrice = 0;

//         // Map over the products and create the orderedProducts array with quantities and product details
//         const orderedProducts = products.map(product => {
//             const foundProduct = productDetails.find(item => item._id.toString() === product.productId);
//             if (foundProduct) {
//                 // Calculate price for the quantity
//                 totalPrice += foundProduct.price * product.qty;
//                 return {
//                     productId: foundProduct._id,
//                     qty: product.qty,
//                     name: foundProduct.name,
//                     price: foundProduct.price,
//                 };
//             }
//         }).filter(item => item !== undefined);  // Filter out any undefined values

//         // Address information setup (assuming you save address directly in the checkout schema)
//         const userAddress = {
//             name,
//             phone,
//             houseAddress: street,
//             city,
//             state,
//             pincode: postalCode,
//             country
//         };

//         // Create a new order based on the data and schema
//         const newOrder = new cheakoutDB({
//             userID: user,  // Assuming user is stored as the user ID
//             paymentMethods: paymentMethod,  // Payment method (e.g., 'cod', 'paypal')
//             totalprice: totalPrice,  // Calculated total price of the order
//             products: orderedProducts,  // Save the ordered products with quantities
//             status: 'pending',  // Initial status of the order (can be updated later)
//             address: userAddress  // Save address details
//         });

//         // Save the new order to the database
//         await newOrder.save();

//         // Optionally clear cart after placing an order (if you're using a cart system)
//         await cartDB.deleteMany({ userID: user });

//         // Respond back with success
//         res.json({
//             success: true,
//             message: 'Order placed successfully.',
//             orderId: newOrder._id  // Return the newly created order ID
//         });
//     } catch (error) {
//         console.error('Error placing order:', error);
//         res.status(500).json({
//             success: false,
//             message: 'There was an issue placing the order. Please try again later.'
//         });
//     }
// };

