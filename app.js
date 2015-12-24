var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var csv = require('csv');
var async = require('async');
var CIO = require('customerio-node');
var cio = new CIO('a34ce87933cc7d880b6c', '348d2912514cb6487c45');

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* GET home page. */
app.get('/', function(req, res, next) {
    res.render('index', { 
        title: 'Import to Customer.io',
        description: 'Please upload your csv file and the application will import the data from this file to Customer.io'
    });
});

app.post('/upload', upload.single('csv'), function(req, res, next) {
    if (req.file.mimetype == 'text/csv') {
        var content = req.file.buffer.toString('utf8');
        csv.parse(content, { columns: true, auto_parse: true }, function(err, data) {
            async.each(data, function(customer, callback) {
                if (customer.email && customer.email.length > 0) {
                    cio.identify(customer.email, customer);
                    callback();
                } else {
                    callback();
                }
            }, function(err) {
                if(err) {
                    res.status(err.status || 500);
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                } else {
                    res.render('result', {
                        title: 'Success',
                        label: 'Import again'
                    });
                }
            });
        });
    } else {
        var err = new Error('File type not correct');
        res.status(err.status || 500);
        res.render('result', {
            title: 'File type no correct',
            label: 'Return and try again'
        });
    }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
