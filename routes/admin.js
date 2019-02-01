var express = require('express');
var async = require('async');
var router = express.Router();
var password_hash = require('../models/password')

router.use(function (req, res, next) {
    if ('db' in req.app.locals) {
        if (req.isAuthenticated())
            return next();
        else
            res.redirect('/login')
    } else {
        return res.redirect('/install');
    }
});

function userView (req, res) {
    console.log(req.app.locals)
    const db = req.app.locals.db;
    async.parallel({ 
        users: function (callback) {
            db.User.findAll({ include: [db.Domain] })
                .then(users =>{
                    callback(null, users);
                });
        },
        domains: function (callback) {
            db.Domain.findAll()
                .then(domains => {
                    callback(null, domains);
                });
        }
    }, function (err, results) {
        return res.render('users', results);
    });
}

router.get('/', userView);
router.get('/users', userView);

router.post('/users', function (req, res) {
    const db = req.app.locals.db;
    if (req.body.action == "add") {
        db.Domain.findOne({ where: { id: req.body.domain_id } })
            .then(domain => {
                password_hash.create(req.body.new_password, function (err, hash) {
                    db.User.create({ username: req.body.new_username, password: hash })
                        .then(user => {
                            user.setDomain(domain).catch(error => {
                                user.destroy();
                            });
                        });
                });
            });
    } else if (req.body.action == "delete") {
        db.User.destroy({ where: { id: req.body.id } });
    }
    return res.redirect('/admin/users');

});

router.get('/domains', function (req, res) {
    const db = req.app.locals.db;
    db.Domain.findAll().then(domains => {
        return res.render('domains', { domains: domains });
    }).catch(error => {
        return res.status(500).json({ message: 'Internal Server Error' });
    });
});

router.post('/domains',function (req, res) {
    const db = req.app.locals.db;
    if (req.body.action == "add") {
        db.Domain.create({ domain: req.body.domain });
    } else if (req.body.action == "delete") {
        db.User.findAll({ include: [{ model: db.Domain, where: { id: req.body.id }}]})
            .then(users => {
                users.forEach( function (user) {
                    user.destroy();
                });
            });
        db.Alias.findAll({ include: [{ model: db.Domain, where: { id: req.body.id }}]})
            .then(aliases => {
                aliases.forEach( function (alias) {
                    alias.destroy();
                });
            });
        db.Domain.destroy({ where: { id: req.body.id }});
    }
    return res.redirect('/admin/domains');
});



function aliasView (req, res) {
    const db = req.app.locals.db;
    async.parallel({ 
        aliases: function (callback) {
            db.Alias.findAll({ include: [db.Domain, { model: db.User, include: [db.Domain]}] })
                .then(aliases =>{
                    callback(null, aliases);
                });
        },
        users: function(callback) {
            db.User.findAll({ include: [db.Domain] })
                .then(users => {
                    callback(null, users);
                });
        },
        domains: function (callback) {
            db.Domain.findAll()
                .then(domains => {
                    callback(null, domains);
                });
        }
    }, function (err, results) {
        return res.render('aliases', results);
    });
}

router.get('/aliases', aliasView);

router.post('/aliases', function (req, res) {
    const db = req.app.locals.db;
    if (req.body.action == "add") {
        db.User.count({ where: { username: req.body.new_alias }, include: [{ model: db.Domain, where: { id: req.body.domain_id }}] })
            .then( c => {
                if (c == 0) {
                    db.Domain.findOne({ where: { id: req.body.domain_id } })
                        .then(domain => {
                            db.User.findOne({ where: { id: req.body.user_id } })
                                .then(user => {
                                    db.Alias.create({ alias: req.body.new_alias })
                                        .then(alias => {
                                            alias.setDomain(domain)
                                                .then(() => {
                                                    alias.addUser(user);
                                                })
                                                .catch(error => {
                                                    alias.destroy();     
                                                });
                                        });
                                });
                        });
                } else {
                    res.locals.userMessage == "Account with that alias already exists.";
                }
            });
    } else if (req.body.action == "delete") {
        db.Alias.destroy({ where: { id: req.body.id } });
    }
    return aliasView(req, res);
});

module.exports = router;
