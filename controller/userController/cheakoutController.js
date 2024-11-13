const cartDB = require('../../schema/cart')
const checkoutDB = require('../../schema/cheakout')
const productDB = require('../../schema/productschema')
const AddressDB = require('../../schema/address')
const { v4: uuidv4 } = require('uuid');
const Razorpay=require('razorpay');
require('dotenv').config()

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

    // if(paymentMethod=='cod'){

    const cart = await cartDB.findOne({ user: user })
    const total = cart.totalAmount

    if(paymentMethod=='cod'){
        // console.log('this is from cod validation')
    
    

    try {
        function generateOrderId() {
            return `ORDER-${uuidv4()}`;
        }
        
        console.log(generateOrderId());

        // const cart = await cartDB.findOne({ user: user })
        // const total = cart.totalAmount
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
    }

    // starting of razor pay 
    if(paymentMethod=='razorpay'){
        console.log('this is form razorpy')
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_ID, 
            key_secret: process.env.RAZORPAY_SECRET
          });
          const options = {
            amount: total * 100,  
            currency: "INR",
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
              key: "value"
            }
          };
          try {
            const order = await razorpay.orders.create(options);
            res.json({ order_id: order.id, currency: order.currency, amount: order.amount })
            console.log('this is from success of Razor');
            // const cart = await cartDB.findOne({ user: user })
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
            const orders = new checkoutDB({
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
            await orders.save()


          } catch (error) {
            console.error("Error creating order:", error);
            res.status(500).send("Error creating Razorpay order");
          }
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

  const user=req.session.userId

  const cart=await cartDB.findOne({user:user})
  if(cart){
    await cartDB.deleteOne({user:user})
    return res.render('user/sucess')
  }else{
  return   res.render('user/sucess');
  }
      
}
