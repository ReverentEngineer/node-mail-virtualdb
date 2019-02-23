var express = require('express');
var router = express.Router();
var passport = require('passport');

router.use(function (req, res, next) {
    const db = req.app.locals.db;
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
    successRedirect: '/admin/users',
    failureRedirect: '/login',
    failureFlash: true 
}));


module.exports = router;
