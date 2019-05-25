var express = require('express');
var router = express.Router();
var password = require('../models/password');
var db = require('../models/db')

router.use(function (req, res, next) {
    db.User.count({})
        .then(c => {
            if (c == 0) {
                next();
            } else {
                return res.status(401).send('Unauthorized')
            }
        });
});

router.get('/', function (req, res) {
    return res.render('install');        
});

router.post('/', function (req, res) {
    if ('password' in req.body && 'username' in req.body) {
        password.create(req.body.password, function (err, password) {
            db.User.create({ username: req.body.username, password: password, admin: true })
                .then(user => {
                    return res.redirect("/login");
                });
        });
    } else {
        res.status(400).send();
    }
});

module.exports = router;
