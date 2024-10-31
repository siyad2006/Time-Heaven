
const adminController = require('./../controller/adminController/adminController')

function isAdmin(req, res, next) {
    console.log('Checking admin session:', req.session);
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}




module.exports = { isAdmin };
