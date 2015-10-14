var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var cookieSession = require('cookie-session');

var index = require('./routes/index');
var users = require('./routes/users');
var active = require('./routes/active');
var other = require('./routes/other');

var app = express();

// ��Ա����ģ��
var Users     = require('./model/users.js');
var usersModel     = new Users();
// ��Ա��Ϣ����ģ��
var UserInfos     = require('./model/user_infos.js');
var usersInfosModel     = new UserInfos();
// ���е����������ģ��
var Archives     = require('./model/Archives.js');
var archiveModel     = new Archives();
// ��̨����ģ��
var Manage_mode     = require('./manage/model/manage.js');
var manageModel     = new Manage_mode();

var moment    = require('moment');



// ���ݿ����ӣ�����ҳ��ֻ��Ҫ����mongooose����������connect����
var mongoose = require('mongoose'),
    dataBase = require("./server/config.js").db;
mongoose.connect('mongodb://localhost/'+dataBase);
global.mongoose = mongoose;


app.locals.moment     = moment;
app.locals.session    = {};
global.moment   = app.locals.moment   = moment;
global.usersModel = usersModel;
global.usersInfosModel = usersInfosModel;
global.archiveModel = archiveModel;
global.manageModel = manageModel;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(cookieParser("wdshare"));
app.use(cookieSession({          //session �����ַ���
    key:'wdshare',
    secret: 'wdshare',
    name  :'wdshare',
    cookie: { path: '/', httpOnly: true, maxAge: null }
}));

app.use('/files/', express.static(path.join(__dirname, 'files')));
app.use('/static/',express.static(path.join(__dirname, 'public')));


app.use(function(req,res,next){
    "use strict";
    res.locals.user = req.session.user;
    res.locals.manageuser = req.session.manageuser;
    next();
});


// ��ҳ
app.use('/', index);
// �
app.use('/active', active);
// ����***
// app.use('/article', article);
// �û�
app.use('/user/', users);




/**
 * �����̨���
 */
// ��̨��¼������
app.use(function (req, res, next) {
    var url = req.originalUrl;
    if (url != "/manage/login" && url.indexOf("/manage") > -1 && !req.session.manageuser) {
        return res.redirect("/manage/login");
    }
    next();
});

var manage = require('./manage/routes/index');
var manage_active = require('./manage/routes/active');
var manage_article = require('./manage/routes/article');
var manage_articleCrumbs = require('./manage/routes/articleCrumbs');

// ��̨��ҳ
app.use('/manage/', manage);
// �����
app.use('/manage/active', manage_active);
// ���¹���
app.use('/manage/article', manage_article);
// ��ҳ�����
app.use('/manage/articleCrumbs', manage_articleCrumbs);






// Other url
app.use('/:id', function(req, res, next) {
    other.url(req, res, next);
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
    //var err = new Error('Not Found');
    //err.status = 404;
    //next(err);
    res.render('404.ejs');
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
