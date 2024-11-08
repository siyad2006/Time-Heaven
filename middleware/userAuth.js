function isRegistered(req, res, next) {
  if (req.session.forOTP==true) {
    next()
  } else {
    res.redirect('/user/register')
  }
}


function loginuser(req,res,next){
 
  if(req.session.loginuser == true){
    // res.redirect()
  
    next()
  }else{
    res.redirect('/user/login')
  }
}

// function checkLogin(req, res, next) {
//   if (req.session.loginuser) {

//     res.redirect('/user/home');
//   } else {

//     res.redirect('/user/login');
//   }
// }


// function checkLoggedIn(req, res, next) {
//   if (req.session.loginuser) {
//     return res.redirect('/user/home');
//   }

//   next();
// }



module.exports = { isRegistered,loginuser}