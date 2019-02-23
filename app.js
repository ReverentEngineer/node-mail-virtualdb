const createError  = require('http-errors');
const randomBytes  = require('crypto').randomBytes;
const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const logger       = require('morgan');
const passport     = require('passport');
const exphbs       = require('express-handlebars');
const session      = require('express-session');
const flash        = require('connect-flash');
const config       = require('config');
const initializeDb = require('./models/db');

var app = express();

const databaseUri = config.get('database.uri');

initializeDb(databaseUri)
    .then(db => {
        app.locals.db = db;
    });

const localAuth = require('./models/localAuth')(app);

passport.use("local", localAuth.strategy);
passport.serializeUser(localAuth.serialize);
passport.deserializeUser(localAuth.deserialize);



function createSession() {
    var session_secret = null;
    session_secret = randomBytes(16).toString('hex')
    return session({ secret: session_secret, resave: false, saveUninitialized: false});
}

app.use(createSession());
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
app.use('/install', require('./routes/install'));

function unauthorized(req, res) {
    return res.status(401).render('login', { login: true, message: 'Unauthorized access. Please sign in first.' });
}

app.use(function (req, res, next) {
    const db = req.app.locals.db;
    db.User.count({})
        .then(c => {
            if (c > 0) {
                if (req.isAuthenticated()) {
                    return next();
                } else {
                    return unauthorized(req, res);
                }    
            } else {
                res.redirect("/install");
            }
        });

});

app.get('/', function (req, res) {
    res.redirect('/admin/');
});

app.use('/admin', require('./routes/admin'));

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
