const exec = require('child_process').exec;
const fs = require('fs')
const config = require('../models/config');
var express = require('express');
var async = require('async');
var router = express.Router();
var initializeDb = require('../models/db').initialize;
var password = require('../models/password');

// Redirect if the database is already installed
router.use(function (req, res, next) {
    const db = req.app.locals.db;
    db.User.count({})
        .then(c => {
            if (c == 0) {
                next();
            } else {
                return res.redirect('/')
            }
        });
});

router.get('/', function (req, res) {
    return res.render('install');        
});

router.post('/', function (req, res) {
    const db = req.app.locals.db; 
    password.create(req.body.password, function (err, password) {
            db.User.create({ username: req.body.username, password: password, admin: true });
    });
    return res.redirect("/login");
});

module.exports = router;
