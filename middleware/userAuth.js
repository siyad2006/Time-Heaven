

function isRegistered(req, res, next) {
  if (req.session.Email) {
    next()
  } else {
    res.redirect('/user/register')
  }
}


function checkLogin(req, res, next) {
  if (req.session.loginuser) {

    res.redirect('/user/home');
  } else {

    res.redirect('/user/login');
  }
}


module.exports = { isRegistered, checkLogin }