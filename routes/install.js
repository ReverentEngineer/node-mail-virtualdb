const exec = require('child_process').exec;
const fs = require('fs')
const validator = require('email-validator')
const config = require('../models/config');
var express = require('express');
var async = require('async');
var router = express.Router();
var initializeDb = require('../models/db').initialize;
var password = require('../models/password');

// Redirect if the database is already installed
router.use(function (req, res, next) {
    if ('db' in req.app.locals && req.app.locals.db != null) {
        return res.redirect('/')
    } else {
        return next()
    }
});

router.get('/', function (req, res) {
    return res.render('install');        
});

router.post('/', function (req, res) {
    if (!validator.validate(req.body.username)) {
        return res.render('install', { userMessage: 'Invalid e-mail' });
    }

    return initializeDb(req.body.uri).then(db => {
        req.app.locals.db = db;
        return db;
    }).then(function (db) {

        async.parallel({
            domain: function (callback) {
                var domain = req.body.username.split('@')[1]
                db.Domain.create({ domain: domain })
                    .then(domain => {
                        callback(null, domain);
                    }).catch(err => {
                        callback(err, null);
                    });
            }, 
            password: function (callback) {
                password.create(req.body.password, function (err, password) {
                    callback(err, password);
                });
            }
        }, function (err, results) {
            if (err) {
                throw err;
            }
            var username = req.body.username.split('@')[0]
            db.User.create({ username: username, password: results.password, admin: true }) 
                .then(user => {
                    user.setDomain(results.domain);
                    user.save();
                });
        });
        return;
    }).then(() => {
        config.write('connection_uri', req.body.uri);
        return res.direct('/')
    }).catch(error => {
        return res.redirect('/install'); 
    });

});

module.exports = router;
