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
const db           = require('./models/db');

var app = express();
db.initialize();

const localAuth = require('./models/localAuth')(app);

passport.use("local", localAuth.strategy);
passport.serializeUser(localAuth.serialize);
passport.deserializeUser(localAuth.deserialize);

app.use(session({ secret: randomBytes(16).toString('hex'), resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use(function (req, res, next) {
    res.locals.user = req.user; 
    console.log(req.user);
    next();
});
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
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
app.use('/install', require('./routes/install'));

function unauthorized(req, res) {
    return res.status(401).render('login', { login: true, message: 'Unauthorized access. Please sign in first.' });
}

app.get('/', function (req, res) {
    return res.render('index');
});

app.use('/admin', require('./routes/admin'));

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(req, res, next) {
    next(createError(401));
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
