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

    let query = {};
    let finalStartDate = new Date();
    let finalEndDate = new Date();


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


    if (startDate && endDate) {
      finalStartDate = new Date(startDate);
      finalEndDate = new Date(endDate);
    }

    query.createdAt = {
      $gte: finalStartDate,
      $lte: finalEndDate
    };

    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID')
 
      
//  return res.json(arr)
    let totalOrders = salesData.length;
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let totalDiscount = 0;

    const offer = await cheackoutDB.aggregate([
      { $group: { _id: null, totaloffer: { $sum: '$discount' } } }, { $project: { _id: 0, totaloffer: 1 } }
    ])
    console.log(offer)
    totalDiscount += offer[0].totaloffer
    console.log(totalDiscount)


    const coupunoffer = await coupunDB.find().populate('user');

    const coupundiscount = coupunoffer.reduce((ini, item) => {
      const prices = item.maximumDiscount || 0;  
      const userCount = Array.isArray(item.user) ? item.user.length : 0; 
         const totaldiscount = prices * userCount;
      ini += totaldiscount;
      return ini;
    }, 0);

    totalDiscount += coupundiscount

    console.log(coupundiscount)

    salesData.forEach(order => {
      totalRevenue += order.totalprice || 0;
      totalItemsSold += order.products.reduce((sum, product) => sum + product.qty, 0);



    });

    console.log('totalOrders', totalOrders,
      'totalRevenue', totalRevenue,
      'totalItemsSold', totalItemsSold,
      'totalDiscount', totalDiscount,
      'salesData', salesData);

    res.render('admin/salesreport', {
      totalOrders,
      totalRevenue,
      totalItemsSold,
      totalDiscount,
      salesData
    });
  } catch (error) {
    console.error('Error generating sales report:', error);

  }
};


exports.downloadpdf = async (req, res) => {
  try { 
     const { startDate, endDate } = req.query;
 
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send('Invalid date format');
    }

 
    const query = { createdAt: { $gte: start, $lte: end } };
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID');

    if (!salesData.length) {
      return res.status(404).send('No sales data found for the given date range');
    }
 
     
    const doc = new PDFDocument();
 
    const filePath = path.join(__dirname, '..', '..', 'public', 'sales_report.pdf');
 
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    
    doc.pipe(fs.createWriteStream(filePath));

 
    doc.fontSize(20).text('Sales Report', { align: 'center' });
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
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send('Invalid date format');
    }
 
    const query = { createdAt: { $gte: start, $lte: end } };
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID');

    if (!salesData.length) {
      return res.status(404).send('No sales data found for the given date range');
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
