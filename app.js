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
var article = require('./routes/article');
var other = require('./routes/other');
var captcha = require('./routes/captcha');// ��֤��

var app = express();

// ��Ա����ģ��
var Users     = require('./model/users.js');
var usersModel     = new Users();
// ��Ա��Ϣ����ģ��
var UserInfos     = require('./model/user_infos.js');
var usersInfosModel     = new UserInfos();
// ���е����������ģ��
var Archives     = require('./model/archives.js');
var archiveModel     = new Archives();
// ��������ģ��
var Actives     = require('./model/new_actives.js');
var activeModel     = new Actives();
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
global.activeModel = activeModel;
global.manageModel = manageModel;


global.siteDir = __dirname;
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
// ����
app.use('/article', article);
// �û�
app.use('/user/', users);
// ��֤��
app.use('/captcha/', captcha);



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
var manage_member = require('./manage/routes/member');

// ��̨��ҳ
app.use('/manage/', manage);
// �����
app.use('/manage/active', manage_active);
// ���¹���
app.use('/manage/article', manage_article);
// ��ҳ�����
app.use('/manage/articleCrumbs', manage_articleCrumbs);
// ��Ա����
app.use('/manage/member', manage_member);


// ueditor���
var ueditor = require('ueditor-nodejs');
app.use('/static/ueditor/ue', ueditor({//�����/ueditor/ue����Ϊ�ļ���������Ϊ��ueditor,���û��������ôӦ����/ueditor�汾��/ue
    // configFile: '/static/ueditor/php/config.json',//������ص���jsp�ģ�����д/ueditor/jsp/config.json
    configFile: '/static/ueditor/config.json',//������ص���jsp�ģ�����д/ueditor/jsp/config.json
    mode: 'local', //���ش洢��дlocal
    accessKey: 'Adxxxxxxx',//���ش洢����д��bcs��д
    secrectKey: 'oiUqt1VpH3fdxxxx',//���ش洢����д��bcs��д
    staticPath: path.join(__dirname, 'public'), //һ��̶���д������̬��Դ��Ŀ¼�������bcs�����Բ���
    // dynamicPath: '/upload' //��̬Ŀ¼����/��ͷ��bcs��дbuckect���֣���ͷû��/.·�����Ը���req��̬�仯��������һ��������function(req) { return '/xx'} req.query.action���������Ϊ��uploadimage��ʾ�ϴ�ͼƬ������鿴config.json.
    dynamicPath: function (req) {
        /**
         * ��Ա���Լ�ID��ͼƬ�ϴ�Ŀ¼������Ա��images
         */
        // ����Ա
        if (req.session.manageuser) {//����ǲ����Լ�
            return '/upload/images';
        }

        // ��Ա
        if (req.session.user) {//����ǲ����Լ�
            return '/upload/'+ req.session.user._id;
        }
    }
}));



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
