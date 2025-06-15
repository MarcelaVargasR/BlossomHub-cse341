const { Router } = require("express"); //destrocturing router from express
const router = new Router();
const passport = require("passport");
const dotenv = require("dotenv");
const { createUser } = require("../controllers/userController");
dotenv.config();

router
  .route("/github/callback")
  .get(passport.authenticate("github"), (req, res, next) => {
    req.session.user = req.user;
    createUser(req, res, next);
    res.redirect(`${process.env.BASE_URL}/api-docs`);
  });

router.route("/login").get(passport.authenticate("github"));

module.exports = router;
