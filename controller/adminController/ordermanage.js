const cheackoutDB = require('../../schema/cheakout');
const product = require('../../schema/productschema');
const address = require('../../schema/address')


exports.getordermanage = async (req, res) => {
  let limit=10
  const page = parseInt(req.query.page) || 1
  const skip = (page - 1) * limit;

  const totalOrders = await cheackoutDB.countDocuments();

 
  const totalPages = Math.ceil(totalOrders / limit);


  const out = await cheackoutDB.find().limit(limit).skip(skip).populate('userID')
  res.render('admin/ordermanage', { 
    out: out ,
     currentPage: page, 
    totalPages: totalPages,})

};

exports.changestatus = async (req, res) => {
  const { orderid, status } = req.body
  console.log(orderid, status)

  await cheackoutDB.findByIdAndUpdate({ _id: orderid }, { status: status }).then(() => console.log('success'))
  res.json({
    success: true,
    message: 'Order status updated successfully'
  });
}

