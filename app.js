const createError = require('http-errors');
const randomBytes = require('crypto').randomBytes;
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const args = require('minimist')(process.argv.slice(2));
const passport = require('passport');
const exphbs = require('express-handlebars');
const session  = require('express-session');
const flash    = require('connect-flash');
const fs = require('fs');
const sequelize = require('sequelize');
const initializeDb = require('./models/db').initialize;
const password_check = require('./models/password').check;
const config = require('./models/config');
var app = express();

function initialize(err, uri) {
    if (!err) {
        initializeDb(uri)
            .then(db => {
                app.locals.db = db;
            });
    } else {
        console.log('No config file found');
    }
}

config.read('connection_uri', initialize); 

const LocalStrategy = require("passport-local").Strategy;
const local = new LocalStrategy((username, password, done) => {
    const db = app.locals.db;
    if (username.indexOf("@") == -1) {
        done(null, null);
    } else {
        var user = username.split('@')[0]
        var domain = username.split('@')[1]
        db.User.findOne({ where: {username: user}, include: [{ model: app.locals.db.Domain, where: { domain: domain }}] }).then(user => {
            if (user) {
                password_check(password, user.password, (err, valid) => {
                    if (err) {
                        throw err
                    } else if (valid) {
                        return done(null, { id: user.id, name: username, admin: user.admin });
                    } else {
                        return done(null, null);
                    }
                });
            } else {
                return done(null, null);
            }
        });
    }
});


function serialize(user, done) {
    done(null, user.id);
}

function deserialize(id, done) {
    const db = app.locals.db;
    db.User.findById(id).then(user => {
        if (user) {
            return done(null, { id: user.id, name: user.mail, admin: user.admin });
        } else {
            return done(null, null);
        }
    });
};


passport.use("local", local);
passport.serializeUser(serialize);
passport.deserializeUser(deserialize);


function setSessionSecret(err, secret) {
    if (!err) {
        app.use(session({ secret: secret, resave: false, saveUninitialized: false })); 
    } else {
        randomBytes(16, function(err, buffer) {
            var secret = buffer.toString('hex')
            app.use(session({ secret: secret, resave: false, saveUninitialized: false })); 
            config.write('session_secret', secret);
        })
    }
}

config.read('session_secret', setSessionSecret);

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

app.engine('.hbs', exphbs({defaultLayout: 'default', extname: '.hbs'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/login', require('./routes/login'));
app.use('/admin', require('./routes/admin'));
app.use('/install', require('./routes/install'));
app.get('/', function (req, res) {
    res.redirect('/admin/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error',  {  status: err.status, message: err.message });
});

module.exports = app;
