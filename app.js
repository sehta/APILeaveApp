var express = require('express');
var router = express.Router();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./model/db');
var jwt = require('jsonwebtoken');
var config = require('./config'); // get our config file
var app = module.exports = express();
app.set('superSecret', config.secret); // secret variable
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var firstroute = require('./routes/default.js');
var notifications = require('./routes/notifications.js');
var routes = require('./routes/index.js');
var users = require('./routes/users.js');
var leaves = require('./routes/leaves.js');
var email=require('./routes/email.js');
var settings = require('./routes/settings.js');
app.use('/', firstroute);
app.use('/api/v1', notifications);
app.use('/api/v1', routes);
app.use('/api/v1', users);
app.use('/api/v1', leaves);
app.use('/api/v1', email);
app.use('/api/v1', settings);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});





module.exports = app;
