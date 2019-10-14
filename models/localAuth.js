const passport      = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const verify        = require('./password').check;
const db            = require('../models/db')

module.exports = function (app) {
    const strategy = new LocalStrategy((username, password, done) => {
        db.User.findOne({ where: {username: username} }).then(user => {
            if (user) {
                verify(password, user.password, (err, valid) => {
                    if (err) {
                        throw err
                    } else if (valid) {
                        return done(null, { id: user.id, name: user.username, admin: user.admin });
                    } else {
                        return done(null, null);
                    }
                });
            } else {
                return done(null, null);
            }
        });
    });

    function serialize(user, done) {
        done(null, user.id);
    }

    function deserialize(id, done) {
        db.User.findOne({ where: { id: id } }).then(user => {
            if (user) {
                return done(null, { id: user.id, name: user.username, admin: user.admin });
            } else {
                return done(null, null);
            }
        });
    };

    return {
        strategy: strategy,
        serialize: serialize,
        deserialize: deserialize
    }
}
