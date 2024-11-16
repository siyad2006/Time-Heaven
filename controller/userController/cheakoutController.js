const cartDB = require('../../schema/cart')
const checkoutDB = require('../../schema/cheakout')
const productDB = require('../../schema/productschema')
const AddressDB = require('../../schema/address')
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
require('dotenv').config()
const mongoose = require('mongoose');
const cheakout = require('../../schema/cheakout');
// const cheakout = require('../../schema/cheakout');
const ObjectId = mongoose.Types.ObjectId;
const walletDB=require('../../schema/wallet')

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

    if (paymentMethod == 'cod') {
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
                productId: x.productId,
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
    if (paymentMethod == 'razorpay') {
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
                productId: x.productId,
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
    const ID = req.params.id
    const userid = req.session.userId

    // console.log(user)
    const db = await checkoutDB.findById(ID)



    if (db.paymentMethods == 'razorpay') {
        console.log('entered to the razorpaay code ')
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'canceled'
        })
        console.log(db.totalprice)
        const isWallet=await walletDB.findOne({user:userid})
        
        // const newdate=new Date()
        // const nowdate=newdate.toLocaleDateString('en-GB')
        const nowdate = new Date(); // Creates a Date object representing the current date and time

        if (isWallet) {
            console.log('User already has a wallet');
            
            const existingWallet = await walletDB.findOne({ user: userid }, { amount: 1, _id: 0 });
            
            if (!existingWallet) {
                throw new Error('Wallet not found for user'); 
            }
            
            const existingAmount = existingWallet.amount || 0; 
            console.log(existingAmount);
            
            const newAmount = existingAmount + db.totalprice;
        
            await walletDB.updateOne(
                { user: userid },
                {
                    amount: newAmount,
                    $push: { 
                        transaction: {
                            typeoftransaction: 'debit',
                            amountOfTransaction: db.totalprice,
                            dateOfTransaction: nowdate,
                        }
                    }
                }
            ).then(() => console.log('Successfully updated the wallet'));
        
            res.redirect(`/user/myorders/${userid}`)
        }
        else{
            console.log('user dont have wallet ')
            const newwallet=new walletDB({
                user:userid,
                amount:db.totalprice,
                transaction:[
                    {
                        typeoftransaction:'debit',
                        amountOfTransaction:db.totalprice,
                        dateOfTransaction: nowdate
                                                
                    }
                ]
               


            })
            newwallet.save()
            res.redirect(`/user/myorders/${userid}`)
        }
        

    } else {
        await checkoutDB.findByIdAndUpdate({ _id: ID}, {
        status: 'canceled'
    })
        
        res.redirect(`/user/myorders/${userid}`)
    }


    // await checkoutDB.findByIdAndUpdate({ _id: id }, {
    //     status: 'canceled'
    // })

    // res.redirect(`/user/myorders/${user}`)


}

exports.success = async (req, res) => {
    console.log('sucessfully entered to the suceess page');

    const user = req.session.userId

    const cart = await cartDB.findOne({ user: user })
    if (cart) {
        await cartDB.deleteOne({ user: user })
        return res.render('user/sucess')
    } else {
        return res.render('user/sucess');
    }

}

exports.details = async (req, res) => {
    console.log('entered to the order details code')
    const order = req.params.id
    const db = await checkoutDB.findById(order)

    const items = db.products.map((item) => ({

        id: item.productId,
        qty: item.qty

    }));

    console.log(items)

    const creat = db.createdAt
    const date = creat.toLocaleDateString('en-GB')
    // console.log(date)
    const a = items.map((x) => new ObjectId(x.id));
    console.log(a)


    const products = await productDB.find({
        _id: { $in: a }
    });

    //   console.log(products);
    const productsWithQty = products.map(product => {
        // Find the corresponding quantity from the items array
        const productQty = items.find(item => item.id.toString() === product._id.toString()).qty;
        return {
            ...product.toObject(),
            qty: productQty
        };
    });
    console.log(productsWithQty)
    //   res.json(db)
    res.render('user/orderdetails', { products: productsWithQty, order: db, date: date })


}

exports.return = async (req, res) => {
    console.log('retrun')
    const ID = req.params.id
    const db = await checkoutDB.findById(ID)
    const userid=req.session.userId
    // console.log(db)
    if (db.paymentMethods == 'razorpay') {
        console.log('entered to the razorpaay code ')
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'return'
        })
        console.log(db.totalprice)
        const isWallet=await walletDB.findOne({user:userid})
        
        // const newdate=new Date()
        // const nowdate=newdate.toLocaleDateString('en-GB')
        const nowdate = new Date(); // Creates a Date object representing the current date and time

        if (isWallet) {
            console.log('User already has a wallet');
            
            const existingWallet = await walletDB.findOne({ user: userid }, { amount: 1, _id: 0 });
            
            if (!existingWallet) {
                throw new Error('Wallet not found for user'); 
            }
            
            const existingAmount = existingWallet.amount || 0; 
            console.log(existingAmount);
            
            const newAmount = existingAmount + db.totalprice;
        
            await walletDB.updateOne(
                { user: userid },
                {
                    amount: newAmount,
                    $push: { 
                        transaction: {
                            typeoftransaction: 'debit',
                            amountOfTransaction: db.totalprice,
                            dateOfTransaction: nowdate,
                        }
                    }
                }
            ).then(() => console.log('Successfully updated the wallet'));
        
            res.redirect(`/user/orderdetails/${ID}`);
        }
        else{
            console.log('user dont have wallet ')
            const newwallet=new walletDB({
                user:userid,
                amount:db.totalprice,
                transaction:[
                    {
                        typeoftransaction:'debit',
                        amountOfTransaction:db.totalprice,
                        dateOfTransaction: nowdate
                                                
                    }
                ]
               


            })
            newwallet.save()
            res.redirect(`/user/orderdetails/${ID}`)
        }
        

    } else {
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'return'
        })

        res.redirect(`/user/orderdetails/${ID}`)
    }



}

exports.wallet= async (req,res)=>{
    console.log(req.params.id)
    const wallet=await walletDB.findOne({user:req.params.id})
    console.log(wallet)
    res.render('user/wallet',{wallet})
}