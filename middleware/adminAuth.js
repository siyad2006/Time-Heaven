
// function isAdmin(req, res, next) {
//     console.log(req.session.admin); 
//     if (req.session.admin) {
//         next(); // User is logged in, proceed to the next middleware/route handler
//     } else {
//         res.redirect('/admin/login'); // Redirect to login if not authenticated
//     }
// }


// module.exports={isAdmin}


const adminController=require('./../controller/adminController/adminController')

// middleware/authMiddleware.js
function isAdmin(req, res, next) {
    console.log('Checking admin session:', req.session); 
    if (req.session.admin) {
        next(); 
    } else  {
        res.redirect('/admin/login'); 
    }
}




module.exports = { isAdmin };
