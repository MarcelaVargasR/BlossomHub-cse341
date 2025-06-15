const { Router } = require("express"); //destrocturing router from express
const router = new Router();
const passport = require("passport");
const dotenv = require("dotenv")
dotenv.config()

router
  .route("/github/callback")
  .get(passport.authenticate("github"), (req, res) => {
    req.session.user = req.user;
    res.redirect(`${process.env.BASE_URL}/api-docs`);
  });


router.route("/login").get(passport.authenticate("github"));

module.exports = router;
