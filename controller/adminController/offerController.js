const offerDB = require('../../schema/offerSchema')
const categoryDB = require('../../schema/category')
const productDB = require('../../schema/productschema')

exports.addoffer = async (req, res) => {
    const category = await categoryDB.find()
    res.render('admin/addoffer', { category })
}






exports.createoffer = async (req, res) => {
    console.log(req.body)

    const name = req.body.name
    const discription = req.body.discription
    const category = req.body.category
    const persent = req.body.persent
    const Expire = req.body.date
    const date = new Date(Expire)
    const startdate = new Date(req.body.startdate)

if(persent>75){
    return res.status(404).send('cannot add more than 75% ');
}
    const isnameactive = await offerDB.findOne({ name: name })
    console.log(isnameactive)

    if (isnameactive) {
        return res.status(404).send('this name is already existas')
    }

    startdate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    console.log(startdate)
    if(startdate<Date.now()){
        return res.status(404).send('Add a valid date ');
       }
    
    if (startdate > date) {
      return res.status(404).send('Start date cannot be later than expire date');
    }

    

    const products = await productDB.find({ category: category })


    if (products && products.length > 0 && products[0].existOffer) {
        const getoffer = await offerDB.findOne({ _id: products[0].existOffer })
        console.log('this is the get offer : ', getoffer)

        if (getoffer.discountValue < persent) {


            console.log('we can apply that offer , because our offer is bigger ')
            //  return res.status(404).send('apply new offer to it  ')
            const offeredproduct = await productDB.find({ existOffer: getoffer._id })
            // console.log(offeredproduct)

            const offer = new offerDB({
                name: name,
                dicription: discription,
                discountValue: persent,
                category: category,
                expire: date,
                start: startdate


            })

            await offer.save()

            const findoffer = await offerDB.findOne({ name: name }, { _id: 1 })

            for (let item of offeredproduct) {
                let normalprice = item.realprice
                const realprice = item.realprice
                const ID = item._id
                const offerPrice = normalprice - (normalprice * (persent / 100));
                await productDB.findByIdAndUpdate(ID, {
                    realprice: realprice,
                    existOffer: findoffer._id,
                    offerPersent: persent,
                    offerprice: offerPrice,
                    regularprice: offerPrice

                }).then(()=>console.log('succeeeeess')).catch((err)=> console.log(err))
            }
            console.log('successfully updated the product to new offer ')
            // return  res.redirect('/admin/addoffer')
            return res.json({ success: true })

        } else {
            console.log('the product have not any offer like that ')
            // return res.status(404).send('new offer is smaller than the current applied offer ')
            res.json({ success: false })
        }

    } else {
        const offer = new offerDB({
            name: name,
            dicription: discription,
            discountValue: persent,
            category: category,
            expire: date,
            start: startdate


        })

        await offer.save()

        const findoffer = await offerDB.findOne({ name: name }, { _id: 1 })
        console.log(findoffer)


        for (let item of products) {
            const normalprice = item.regularprice;
            const ID = item.id;
            const offerPrice = normalprice - (normalprice * (persent / 100));
            console.log(offerPrice)


            await productDB.findByIdAndUpdate(ID, {
                regularprice: offerPrice,
                offerprice: offerPrice,
                realprice: normalprice,
                offerPersent: persent,
                existOffer: findoffer._id
            }, { new: true });
            console.log(products)
        }
        // res.redirect('/admin/addoffer')
        res.json({ success: true })
        console.log('successfully added newoffers to the products in that category ')

    }



}


exports.getoffer= async (req,res)=>{
    const offers= await offerDB.find()
    res.render('admin/offer',{offers})
}


exports.deleteoffer= async (req,res)=>{
    const ID= req.params.id

    console.log(ID)

    const productsWithoffer= await productDB.find({existOffer:ID})
    // res.json(productsWithoffer)
    
    for(let item of productsWithoffer){
        var id=item.id
        const currentproduct= await productDB.findById({_id:id},{realprice:1})
        let newid=currentproduct._id
        const realprice=currentproduct.realprice
        await productDB.findByIdAndUpdate(newid,{
            regularprice:realprice,
            existOffer:null,
            offerPersent:0,
            offerprice:0

        })

    }
    await offerDB.findByIdAndDelete(ID).then(()=> console.log('success')).catch((err)=>console.log(err))
    // const cheack=await await productDB.find({existOffer:ID})
    res.redirect('/admin/offer')

}
 
exports.editoffer= async (req,res)=>{
    // console.log('this is for edit offer ')
    const ID= req.params.id
    const currentOffer= await offerDB.findById(ID)
    const category= await categoryDB.findOne({_id:currentOffer.category})

    res.render('admin/editoffer',{offer:currentOffer,category:category})
}




// this is for when we try to edit the offer 
exports.posteditoffer= async (req,res)=>{
    console.log('edit offer page got successfully')
    const ID=req.params.id
    console.log(ID)
    const persent=req.body.persent
    const{startdate,date,name}=req.body
    console.log(persent,startdate,date,name)
    const startdates=new Date(startdate)
    const expires= new Date(date)
    const currentOffer=await offerDB.findById(ID)
    console.log(currentOffer)
    const offeredproduct=await productDB.find({existOffer:ID})
    console.log(offeredproduct)
    const category= req.body.category
    console.log(category)
// const categoryproducts=await productDB.find({category:category})
// console.log(categoryproducts)

// if(categoryproducts.length>0){
//     for(let i of categoryproducts){

//     }
// }



    for(let item of offeredproduct){
        const id=item._id
        const realprice=item.realprice
        const offerPrice = realprice - (realprice * (persent / 100))
        
        await productDB.findOneAndUpdate({_id:id},{
            regularprice:offerPrice,
            offerPersent:persent,
            offerprice:offerPrice,
            realprice:realprice
           

        }).then(()=> console.log('success'))
        
    }
    await offerDB.findByIdAndUpdate(ID,{
        name:name,
        start:startdates,
        expire:expires,
        discountValue:persent
    }).then(()=> {
        console.log('offer updated successfully ')
        res.redirect('/admin/offer')
    })
    
}

