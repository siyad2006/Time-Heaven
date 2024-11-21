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
 



module.exports = { isRegistered,loginuser}