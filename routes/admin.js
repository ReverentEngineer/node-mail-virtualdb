var express = require('express');
var async = require('async');
var router = express.Router();
var password_hash = require('../models/password')
var execSync = require('child_process').execSync;
const db = require('../models/db')

router.use(function (req, res, next) {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    } else {
        return res.status(401).render('error', { message: 'Unauthenticated access. Please login' });
    }
});

function userView (req, res) {
    db.User.findAll({})
        .then(users => {
            return res.render('users', { users: users });
        });
}

router.get('/', userView);
router.get('/users', userView);

router.post('/users', function (req, res) {
    if (req.body.action == "add") {
        password_hash.create(req.body.new_password, function (err, hash) {
            db.User.create({ username: req.body.new_username, password: hash, admin: false });
        });
    } else if (req.body.action == "delete") {
        db.User.destroy({ where: { id: req.body.id } });
    }
    return res.redirect('/admin/users');

});

router.get('/domains', function (req, res) {
    db.Domain.findAll().then(domains => {
        return res.render('domains', { domains: domains });
    }).catch(error => {
        return res.status(500).json({ message: 'Internal Server Error' });
    });
});

function privateToDKIM(selector, privateKey) {
    var pubkey = execSync('openssl rsa -pubout', { input: privateKey })
    var lines = pubkey.toString('ascii').split('\n')
    lines.splice(lines.length-2, 2);
    lines.splice(0, 1);
    for (var i = 0; i < lines.length; i++) {
        lines[i] = '"' + lines[i] + '"'
    }
    var result = lines.join('\n');
    result = selector + '._domainkey 14400 IN TXT ("v=DKIM1; k=rsa; p="\n' + result
    result = result + " )"
    return result
}

router.get('/dkim', function (req, res) {
    db.Domain.findOne({ where: { id: req.query.id} })
        .then(domain => {
            if (domain) {
                var selector = domain.selector;
                var privKey = Buffer.from(domain.dkim_key, 'base64').toString('ascii');
                res.setHeader('Content-disposition', 'attachment; filename=txt-record-' + domain.domain + '.txt');
                res.set('Content-Type', 'text/plain');
                res.status(200).send(privateToDKIM(selector, privKey))
            } else {
                res.status(404).send();
            }
        });
});

router.post('/domains',function (req, res) {
    if (req.body.action == "add") {
        db.Domain.create({ domain: req.body.domain });
    } else if (req.body.action == "delete") {
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
    async.parallel({ 
        aliases: function (callback) {
            db.Alias.findAll({ include: [db.Domain, db.User] })
                .then(aliases =>{
                    callback(null, aliases);
                });
        },
        users: function(callback) {
            db.User.findAll({ })
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
    if (req.body.action == "add") {
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
    } else if (req.body.action == "delete") {
        db.Alias.destroy({ where: { id: req.body.id } });
    }
    return aliasView(req, res);
});

module.exports = router;
