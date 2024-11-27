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
const walletDB = require('../../schema/wallet')
const coupunDB = require('../../schema/coupunSchama');
const { x } = require('pdfkit');

exports.getcheackout = async (req, res) => {
    const cartId = req.params.cart;
    const userId = req.session.userId;

    const cartItem = await cartDB.findById(cartId);
    const address = await AddressDB.find({ user: userId });
    const cartTotal = cartItem.totalAmount

    const coupun = await coupunDB.findById(cartItem.coupun)

    // if(cartTotal+coupun.maximumDiscount<=coupun.minimumPurchase){
    //       req.flash('limit',`please buy items more than ${coupun.minimumPurchase}`)
    //     return res.redirect(`/user/cart/${userId}`)


    // }

    if (coupun) {
        if (cartTotal + coupun.maximumDiscount <= coupun.minimumPurchase) {
            req.flash('limit', `Please buy items worth more than ${coupun.minimumPurchase}`);
            return res.redirect(`/user/cart/${userId}`);
        }
    }


    const cartProducts = cartItem.products.map(product => ({
        productId: product.productId,
        qty: product.qty
    }));

    const products = await productDB.find({ _id: { $in: cartProducts.map(item => item.productId) } });

    const cartProductDetails = products.map(product => {

        const cartProduct = cartProducts.find(item => item.productId.toString() === product._id.toString());
        return {
            ...product.toObject(),
            qty: cartProduct.qty,

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


    const cart = await cartDB.findOne({ user: user });



    if (!cart) {
        throw new Error("Cart not found for the user.");
    }
    let total = cart.totalAmount;
    let coupunamount = 0;




    if (cart && cart.coupun) {
        const coupun = await coupunDB.findById(cart.coupun);
        coupunamount += Number(coupun.maximumDiscount);


    }
    console.log('Coupon Amount:', coupunamount);

    const cheakpro = await productDB.find();
    if (coupunamount > 0) {
        console.log('Entered the check code');
        let subtotal = 0;
        let cheaktotal = total + coupunamount;  

        // const pro = cart.products.map((item) => {
        for (let item of cart.products) {
            const findpro = cheakpro.find(x => x._id.toString() === item.productId.toString());
            console.log('Checking product ID:', item.productId, 'Found Product:', findpro);

            if (findpro) {
                subtotal += findpro.regularprice * item.qty;
            } else {
                console.log(`Product with ID ${item.productId} not found.`);
            }
            if (item.qty > findpro.quantity) {
                return res.status(404).send(`this product :${findpro.name} have no qty by for  you selected qty `)
            }
        }

        console.log('Calculated Subtotal:', subtotal);
        console.log('Total after Coupon Applied:', cheaktotal);

        if (cheaktotal !== subtotal) {
            console.log('Price mismatch detected, returning error');
            return res.status(404).send('you cant add it because of the admin make changes in the products peice  ')
        }
    } else {
        let subtotal = 0;
        let cheaktotal = total
        // const pro = cart.products.map((item) => {
        for (let item of cart.products) {
            const findpro = cheakpro.find(x => x._id.toString() === item.productId.toString());
            console.log('Checking product ID:', item.productId, 'Found Product:', findpro);


            if (findpro) {
                subtotal += findpro.regularprice * item.qty
            } else {
                console.log(`Product with ID ${item.productId} not found.`);
            }
            if (!findpro) {
                return res.status(404).send(`Product with ID ${item.productId} does not exist.`);
            }

            // Continue processing only if no response is sent
            if (item.qty > findpro.quantity) {
                return res.status(404).send(`This product: ${findpro.name} does not have enough quantity.`);
            }
        }

        console.log('Calculated Subtotal:', subtotal);
        console.log('Total after Coupon Applied:', cheaktotal);

        if (cheaktotal !== subtotal) {
            console.log('Price mismatch detected, returning error');
            return res.status(404).send('you cant add it because of the admin make changes in products price  ')
        }
    }

    console.log('Proceeding with checkout');


    if (paymentMethod === 'cod') {
        try {
            function generateOrderId() {
                return `ORDER-${uuidv4()}`;
            }

            console.log(generateOrderId());

            if (!cart || cart.products.length === 0) {
                return res.status(400).send("Cart is empty");
            }


            // const items = cart.products.map(x => ({

            //     productId: x.productId,
            //     qty: x.qty,
            // }));
            const productdata = await productDB.find()
            const items = cart.products.map(x => {
                const product = productdata.find(p => p._id.toString() === x.productId.toString());
                return {
                    productId: x.productId,
                    qty: x.qty,
                    soldprice: product.regularprice // Default to 0 if not found
                };
            });

            for (const item of items) {
                const product = await productDB.findById(item.productId);
                if (product) {

                    if (product.quantity < item.qty) {
                        return res.status(400).send(`Not enough stock for product: ${product.name}`);
                    }
                    console.log('Product sold:', product.sold);
                    console.log('Item quantity:', item.qty);

                    product.sold = Number(product.sold || 0) + Number(item.qty);

                    product.quantity -= item.qty;
                    await product.save();
                }
            }
            let discounts = 0
            for (let i of items) {
                const product = await productDB.findById(i.productId);
                if (product) {
                    if (product.realprice > product.regularprice) {
                        const down = Number(product.realprice - product.regularprice)*i.qty;
                        discounts += down;
                    }
                }
            }
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
                    country: country
                },
                discount: discounts,
                applayedcoupun: coupunamount

            });

            await order.save();
            await cartDB.findOneAndDelete({ user: user });

            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error processing order");
        }
    }

    if (paymentMethod === 'razorpay') {
        console.log('this is from razorpay');

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_ID,
            key_secret: process.env.RAZORPAY_SECRET
        });

        const options = {
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
                key: "value"
            }
        };

        try {
            const order = await razorpay.orders.create(options);
            res.json({ order_id: order.id, currency: order.currency, amount: order.amount });
            console.log('this is from success of Razor');

            if (!cart || cart.products.length === 0) {
                return res.status(400).send("Cart is empty");
            }

            const productdata = await productDB.find()
            const items = cart.products.map(x => {
                const product = productdata.find(p => p._id.toString() === x.productId.toString());
                return {
                    productId: x.productId,
                    qty: x.qty,
                    soldprice: product.regularprice // Default to 0 if not found
                };
            });

            for (const item of items) {
                const product = await productDB.findById(item.productId); // Find the product by ID
                if (product) {

                    if (product.quantity < item.qty) {
                        return res.status(400).send(`Not enough stock for product: ${product.name}`);
                    }
                    // product.sold += Number(item.qty)
                    console.log('Product sold:', product.sold);
                    console.log('Item quantity:', item.qty);

                    product.sold = Number(product.sold || 0) + Number(item.qty);

                    product.quantity -= item.qty;
                    await product.save();
                }
            }
            let discounts = 0
            for (let i of items) {
                const product = await productDB.findById(i.productId);
                if (product) {
                    if (product.realprice > product.regularprice) {
                        const down = Number(product.realprice - product.regularprice)*i.qty;
                        discounts += down;
                    }
                }
            }
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
                    country: country
                },
                discount: discounts
            });


            await orders.save();
            await cartDB.findOneAndDelete({ user: user });

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
        const isWallet = await walletDB.findOne({ user: userid })

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

            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }

                // if (singleItem.quantity < buyedqty) {
                //     console.log(`Insufficient stock for product with ID ${id}`);
                //     return res.status(400).send(`Not enough stock for product with ID ${id}`);
                // }


                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;

                // singleItem.quantity += buyedqty;


                await singleItem.save();
            }



            res.redirect(`/user/myorders/${userid}`)
        }
        else {

            console.log('user dont have wallet ')
            const newwallet = new walletDB({
                user: userid,
                amount: db.totalprice,
                transaction: [
                    {
                        typeoftransaction: 'debit',
                        amountOfTransaction: db.totalprice,
                        dateOfTransaction: nowdate

                    }
                ]



            })
            newwallet.save()
            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            console.log(items)
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }

                // if (singleItem.quantity < buyedqty) {
                //     console.log(`Insufficient stock for product with ID ${id}`);
                //     return res.status(400).send(`Not enough stock for product with ID ${id}`);
                // }

                // product.sold -= item.qty
                // console.log('Product sold:', product.sold);
                //     console.log('Item quantity:', item.qty);

                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;


                await singleItem.save();
            }

            res.redirect(`/user/myorders/${userid}`)
        }


    }
    if (db.paymentMethods == 'cod') {
        console.log('entered to else cancel order ')
        await checkoutDB.findByIdAndUpdate({ _id: ID }, {
            status: 'canceled'
        })

        const canceledproducts = await checkoutDB.findById(ID)
        const items = canceledproducts.products
        for (let pro of items) {
            const id = pro.productId;
            const singleItem = await productDB.findById(id);
            const buyedqty = pro.qty;

            if (!singleItem) {
                console.log(`Product with ID ${id} not found`);
                return res.status(404).send(`Product with ID ${id} not found`);
            }

            // if (singleItem.quantity < buyedqty) {
            //     console.log(`Insufficient stock for product with ID ${id}`);
            //     return res.status(400).send(`Not enough stock for product with ID ${id}`);
            // }

            // product.sold -= item.qty

            singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

            singleItem.quantity += buyedqty;


            // puthiya options 

            // singleItem.quantity += buyedqty;


            await singleItem.save();
        }


        res.redirect(`/user/myorders/${userid}`)

    }




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
        qty: item.qty,
        soldprice: item.soldprice

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

        const productQty = items.find(item => item.id.toString() === product._id.toString()).qty;
        const solds = items.find(item => item.id.toString() === product._id.toString()).soldprice;
        return {
            ...product.toObject(),
            qty: productQty,
            solds: solds

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
    const userid = req.session.userId
    // console.log(db)
    if (db.paymentMethods == 'razorpay') {
        console.log('entered to the razorpaay code ')
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'return'
        })
        console.log(db.totalprice)
        const isWallet = await walletDB.findOne({ user: userid })

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


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }

                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }


            res.redirect(`/user/orderdetails/${ID}`);
        }
        else {
            console.log('user dont have wallet ')
            const newwallet = new walletDB({
                user: userid,
                amount: db.totalprice,
                transaction: [
                    {
                        typeoftransaction: 'debit',
                        amountOfTransaction: db.totalprice,
                        dateOfTransaction: nowdate

                    }
                ]



            })
            newwallet.save()


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }

                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }


            res.redirect(`/user/orderdetails/${ID}`)
        }


    } else {
        await checkoutDB.findByIdAndUpdate(ID, {
            status: 'return'
        })
        const isWallet = await walletDB.findOne({ user: userid })

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


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }

                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }
        } else {

            console.log('user dont have wallet ')
            const newwallet = new walletDB({
                user: userid,
                amount: db.totalprice,
                transaction: [
                    {
                        typeoftransaction: 'debit',
                        amountOfTransaction: db.totalprice,
                        dateOfTransaction: nowdate

                    }
                ]



            })
            newwallet.save()


            const canceledproducts = await checkoutDB.findById(ID)
            const items = canceledproducts.products
            for (let pro of items) {
                const id = pro.productId;
                const singleItem = await productDB.findById(id);
                const buyedqty = pro.qty;

                if (!singleItem) {
                    console.log(`Product with ID ${id} not found`);
                    return res.status(404).send(`Product with ID ${id} not found`);
                }

                if (singleItem.quantity < buyedqty) {
                    console.log(`Insufficient stock for product with ID ${id}`);
                    return res.status(400).send(`Not enough stock for product with ID ${id}`);
                }



                singleItem.sold = Number(singleItem.sold || 0) - Number(pro.qty);

                singleItem.quantity += buyedqty;




                await singleItem.save();
            }
        }

        res.redirect(`/user/orderdetails/${ID}`)
    }

}






exports.wallet = async (req, res) => {
    console.log(req.params.id)
    const wallet = await walletDB.findOne({ user: req.params.id })
    console.log(wallet)
    res.render('user/wallet', { wallet })
}
