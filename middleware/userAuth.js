

function isRegistered(req,res,next){
    if(req.session.Email){
        next()
    }else{
        res.redirect('/user/register')
    }
}

// function isloged(req, res, next) {
//     if (req.session.Email) {
//       next(); // User is logged in, so proceed to the route
//     } else {
//       res.redirect('/user/login'); // Redirect to login if user is not logged in
//     }
//   }
function checkLogin(req, res, next) {
    if (req.session.loginuser) { 
      // If the user is logged in, redirect to the home page
      res.redirect('/user/home');
    } else {
      // If not logged in, redirect to the login page
      res.redirect('/user/login');
    }
  }
  

module.exports={isRegistered,checkLogin}