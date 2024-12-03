const cheackoutDB = require('../../schema/cheakout');
const product = require('../../schema/productschema');
const address = require('../../schema/address')
const offerDB = require('../../schema/offerSchema')
const coupunDB = require('../../schema/coupunSchama')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

exports.getordermanage = async (req, res) => {
  let limit = 10
  const page = parseInt(req.query.page) || 1
  const skip = (page - 1) * limit;

  const totalOrders = await cheackoutDB.countDocuments();


  const totalPages = Math.ceil(totalOrders / limit);


  const out = await cheackoutDB.find().limit(limit).skip(skip).populate('userID')
  res.render('admin/ordermanage', {
    out: out,
    currentPage: page,
    totalPages: totalPages,
  })

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


// exports.getsalesreport= async (req,res)=>{

// console.log(req.query.filter)

//   res.render('admin/salesreport')
//   // console.log(req.query.filter)


// }


exports.getsalesreport = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    let query = { status: { $nin: ['canceled', 'return'] } };
    let finalStartDate = new Date();
    let finalEndDate = new Date();

    if (startDate > endDate) {
      console.log('entered to the condition code ')
      req.flash('date', 'cannot start date less than send date ')
      return res.redirect('/admin/salesreport')
    }

    if (filter) {
      switch (filter) {
        case 'daily':
          finalStartDate.setHours(0, 0, 0, 0);
          finalEndDate = new Date();
          break;
        case 'weekly':
          finalStartDate.setDate(finalStartDate.getDate() - 7);
          break;
        case 'monthly':
          finalStartDate.setMonth(finalStartDate.getMonth() - 1);
          break;
        case 'yearly':
          finalStartDate.setFullYear(finalStartDate.getFullYear() - 1);
          break;
        default:
          break;
      }
    }

    console.log('start and end date', startDate, endDate)
    
 

    if (startDate && endDate) {
      finalStartDate = new Date(startDate) || Date.now();
      finalEndDate = new Date(endDate);
    }

    query.createdAt = {
      $gte: finalStartDate,
      $lte: finalEndDate

    };

    console.log('after final start and end date ', finalStartDate, finalEndDate)

    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID')


    let totalOrders = salesData.length;
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let totalDiscount = 0;


    const offer = await cheackoutDB.aggregate([
      { $match: { createdAt: { $gte: finalStartDate }, status: { $in: ['shipped', 'pending', 'delevered'] } } },
      { $group: { _id: null, totaloffer: { $sum: '$discount' } } },
      { $project: { _id: 0, totaloffer: 1 } }
    ]);

    const totalOffer = offer.length > 0 ? offer[0].totaloffer : 0;
    totalDiscount += totalOffer


    console.log(totalDiscount)

    // this is the original 
    // const coupunoffer = await coupunDB.find().populate('user');



    const coupunoffer = await coupunDB.find({ createdAt: finalStartDate, expiryDate: finalEndDate }).populate('user');

    const coupundiscount = coupunoffer.reduce((ini, item) => {
      const prices = item.maximumDiscount || 0;
      const userCount = Array.isArray(item.user) ? item.user.length : 0;
      const totaldiscount = prices * userCount;
      ini += totaldiscount;
      return ini;
    }, 0);

    const coupunAmount = await cheackoutDB.aggregate([
      { $match: { createdAt: { $gte: finalStartDate, $lte: finalEndDate }, status: { $nin: ['return,canceled'] } } }, { $group: { _id: null, coupun: { $sum: '$applayedcoupun' } } }, { $project: { _id: 0, coupun: 1 } }
    ])
    console.log('coupun amount ', coupunAmount)
    totalDiscount += coupunAmount[0]?.coupun || 0

    console.log(coupundiscount)

    salesData.forEach(order => {
      totalRevenue += order.totalprice || 0;
      totalItemsSold += order.products.reduce((sum, product) => sum + product.qty, 0);



    });
    req.session.totalOrders = totalOrders
    req.session.totalRevenue = totalRevenue
    req.session.totalDiscount = totalDiscount

    console.log('totalOrders', totalOrders,
      'totalRevenue', totalRevenue,
      'totalItemsSold', totalItemsSold,
      'totalDiscount', totalDiscount,
      'salesData', salesData);
    console.log(req.session)
    res.render('admin/salesreport', {
      totalOrders,
      totalRevenue,
      totalItemsSold,
      totalDiscount,
      salesData,
      valid: req.flash('date'),
     
    });
  } catch (error) {
    console.error('Error generating sales report:', error);

  }
};


exports.downloadpdf = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    console.log(filter, startDate, endDate)

    console.log('load pdf startted ')
    let start = new Date();
    let end = new Date();
    console.log(start, end)
    if (startDate && endDate) {
      console.log('entered to the start edn')
      start = new Date(startDate);
      end = new Date(endDate);
    }

    if (filter) {
      switch (filter) {
        case 'daily':
          console.log('entered to the daily ')
          start.setHours(0, 0, 0, 0);

          break;
        case 'weekly':
          console.log('entered to the weekly ')
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'yearly':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          break;
      }
    }


    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send('Invalid date format');
    }

    console.log(start)
    console.log(end)


    const query = { createdAt: { $gte: start, $lte: end }, status: { $nin: ['return', 'canceled'] } };
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID');

    if (!salesData.length) {
      req.flash('date', 'there is no data within this date range ')
      return res.redirect('/admin/salesreport')
    }


    const doc = new PDFDocument();

    const filePath = path.join(__dirname, '..', '..', 'public', 'sales_report.pdf');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }


    doc.pipe(fs.createWriteStream(filePath));



    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.text(`totalOrder : ${req.session.totalOrders}`)
    doc.text(`revenew : ${req.session.totalRevenue}`)
    doc.text(`discount :${req.session.totalDiscount}`)
    doc.moveDown();

    salesData.forEach((sale, index) => {
      doc.fontSize(12).text(`Order ${index + 1}`);
      doc.text(`User: ${sale.userID.username}`);
      doc.text(`Order ID: ${sale._id}`);
      doc.text(`Net Sales: ₹${sale.totalprice}`);
      doc.text(`discount : ${sale.discount}`);
      doc.text(`Date: ${sale.createdAt}`);

      doc.moveDown();
    });

    doc.end();

    res.download(filePath, 'sales_report.pdf', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending PDF');
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};




exports.downloadExcel = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    let start = new Date()
    let end = new Date()


    if (filter) {
      switch (filter) {
        case 'daily':
          start = start.setHours(0, 0, 0, 0)
          break;
        case 'weekly':
          start = start.setDate(start.getDate() - 7)
          break;
        case 'monthly':
          start = start.setDate(start.getMonth() - 1)
          break;

        case 'yearly':
          start = start.setFullYear(start.getFullYear() - 1)
          break;

        default:
          console.log('there is no filter like you giv e')
          break


      }
    }

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);

    }


    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send('Invalid date format');
    }

    const query = { createdAt: { $gte: start, $lte: end }, status: { $nin: ['return', 'canceled'] } };
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID');

    if (startDate > endDate) {

      req.flash('date', 'Start Date must be less than end date ,please enter a valid date ')
      return res.redirect('/admin/salesreport')
    }

    if (!salesData.length) {
      req.flash('date', 'there is no data within this Date Range ')
      return res.redirect('/admin/salesreport')
    }

    const formattedData = salesData.map((sale, index) => ({
      Order: index + 1,
      User: sale.userID.username,
      'Order ID': sale._id.toString(),
      'Net Sales': `₹${sale.totalprice}`,
      Discount: sale.discount,
      Date: sale.createdAt.toISOString()
    }));

    const worksheet = xlsx.utils.json_to_sheet(formattedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    const filePath = path.join(__dirname, '..', '..', 'public', 'sales_report.xlsx');

    xlsx.writeFile(workbook, filePath);

    res.download(filePath, 'sales_report.xlsx', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending Excel file');
      }

      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send('Error generating Excel');
  }
};


exports.orderview = async (req, res) => {
  console.log(req.params.id)
  let ID = req.params.id
  const order = await cheackoutDB.findById(ID).populate('products.productId')
  const discount = order.discount
  const realprice = Number(order.totalprice + discount + order.applayedcoupun)
  // return res.json(order) 
  res.render('admin/orderview', { order, discount, realprice })

}