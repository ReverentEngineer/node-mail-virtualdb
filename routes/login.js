var express = require('express');
var router = express.Router();
var passport = require('passport');
var db = require('../models/db');

router.use(function (req, res, next) {
    db.User.count()
        .then(c => {
            if (c == 0) {
                res.redirect("/install");
            } else {
                next();
            }
        });
});

router.get("/", function (req, res) {
    res.render("login");
});

router.post("/", passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true 
}));


module.exports = router;
