var createError  = require('http-errors');
var express      = require('express');
var path         = require('path');
var cookieParser = require('cookie-parser');
var logger       = require('morgan');
var exphbs       = require('express-handlebars');
var session      = require('express-session');
var flash        = require('connect-flash');
var db           = require('./models/db');
const crypto     = require('crypto')
const config     = require('config')

var app = express();
db.initialize();
const buf = Buffer.alloc(16);
crypto.randomFillSync(buf);
app.use(session({ secret: buf.toString('hex'), resave: false, saveUninitialized: false })); 
if (process.env.NODE_ENV != "development") {
    const passport   = require('./models/passport')(db);
    app.use(passport.initialize());
    app.get('/auth/github',
        passport.authenticate('github'));

    app.get('/auth/github/callback', 
        passport.authenticate('github'),
        function(req, res) {
            res.redirect('/admin');
        });
}

app.use(flash());
app.engine('.hbs', exphbs({defaultLayout: 'default', extname: '.hbs'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.has('mailFrom')) {
    const mailer = require('./models/mail');
    app.locals.mailer = mailer;
    app.locals.mailFrom = config.get('mailFrom');
}

app.use("/admin", require('./routes/admin'));
app.use("/rsvp", require('./routes/rsvp'));

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') != 'production' ? err : {};

    res.status(err.status || 500);
    res.render('error',  {  status: err.status, message: err.message, layout: 'noauth' });
});

module.exports = app;
