const coupunDB = require('../../schema/coupunSchama')

exports.getpage = async (req, res) => {
    const coupunname = await coupunDB.find();

    res.render('admin/coupun',{coupunname})
}

exports.addcoupun = async (req, res) => {

    const { code, minimum, maximum, coupontitle, expire } = req.body
    // console.log(req.body)
    const coupunname = await coupunDB.findOne({code:code})
    const coupuntitles= await coupunDB.findOne({title:coupontitle})
    // console.log(coupunname,coupuntitles)
    if (coupunname || coupuntitles) {

        res.json({ success: false, message: 'this  is already in use' })

    } else {
        console.log('entered to this cod ')
        const expires = new Date(expire)
        console.log(expires)

        const coupun = new coupunDB({
            code: code,
            minimumPurchase: parseInt(minimum),
            maximumDiscount: parseInt(maximum),
            title: coupontitle,
            expiryDate: expires
        })

        await coupun.save()

        res.json({ success: true, message: 'Coupon created successfully!', redirectUrl: '/admin/coupun' });
       
    }



}