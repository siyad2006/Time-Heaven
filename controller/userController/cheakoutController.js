const cartDB = require('../../schema/cart')
const checkoutDB = require('../../schema/cheakout')
const productDB = require('../../schema/productschema')
const AddressDB = require('../../schema/address')
const { v4: uuidv4 } = require('uuid');

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

    const { name, phone, street, city, state, postalCode, paymentMethod, products, country } = req.body;
    console.log(name, phone, street, city, state, postalCode, paymentMethod, products);

    try {
        function generateOrderId() {
            return `ORDER-${uuidv4()}`;
        }
        
        console.log(generateOrderId());

        const cart = await cartDB.findOne({ user: user })
        const total = cart.totalAmount
        console.log(cart)
        if (!cart || cart.products.length === 0) {
            return res.status(400).send("Cart is empty");
        }
        console.log(cart)
        const items = cart.products.map(x => ({
            productId: x._id,
            qty: x.qty

        }))

        console.log(items)
        const order = new checkoutDB({
            userID: user,
            paymentMethods: paymentMethod,
            totalprice: total,
            products: items,
            status: 'pending',
            address: {
                name: name,
                phone: phone,
                houseAddress: street,
                city: city,
                state: state,
                pincode: postalCode,
                country: country,

            },
       
            
        })
        await order.save()
        await cartDB.findOneAndDelete({ user: user })
        res.json({ success: true });
    } catch (error) {
        console.log(error)
    }

};


exports.myorders = async (req, res) => {
    const userID = req.session.userId;


    const orders = await checkoutDB.find({ userID: userID });
    console.log(orders);

    res.render('user/myorder', { orders })



}

exports.cancelorder = async (req, res) => {
    const id = req.params.id
    const user=req.session.userId
    console.log(user)
    await checkoutDB.findByIdAndUpdate({ _id: id }, {
        status: 'canceled'
    })

    res.redirect(`/user/myorders/${user}`)


}

exports.success= async (req,res)=>{
    console.log('sucessfully entered to the suceess page');

    res.render('user/sucess');
}
