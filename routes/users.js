var express   = require('express'),
    sendMail  = require("../server/sendMail.js"),
    router    = express.Router(),
    init      = require("../server/init.js"),
    authorize = init.authorize,
    goBack    = init.goBack,
    crypto    = require('crypto'),
    moment    = require("moment"),
    config    = require("../server/config");

//�༭�û�����
router.route('/user').all(authorize).get(function(req, res) {
  "use strict";
  var id = req.session.user._id;
  factory.getAll({
    key:"Category"
  },function(err,categories){
    if(err){
      categories = [];
    }
    factory.getOne({
      key:"User",
      body:{
        _id:id
      }
    },function(err,user) {
      if(err){
        user = {};
      }
      res.render('admin/user', { title: 'oSpring', description: "Ϊ�¶���", categories: categories,user:user,cur:"user"});
    });
  });
}).post(function(req, res) {
  "use strict";
  var username = req.body.username || req.session.user.email,
      age      = req.body.age || 18,
      sex      = req.body.sex || null,
      id       = req.session.user._id;

  factory.update({_id:id},{
    key:"User",
    body:{
      //email: email,
      username:username ,
      age:age ,
      sex:sex
    }
  },function(err,num,data){
    if(err){
      res.send({message:err});
      return;
    }
    for(var key in data){
      if(!data.hasOwnProperty[key]) {
        req.session.user[key] = data[key];
      }
    }
    res.send({id:data._id,status:200,code:1,message:"���³ɹ���"});
  });
});

//�޸�����
router.route("/password").all(authorize).get(function(req,res){
  "use strict";
  factory.getAll({
    key:"Category"
  },function(err,categories){
    if(err) {
      categories = [];
    }
    res.render('admin/password', { title: 'oSpring',"description":"Ϊ�¶���",categories:categories,cur:"password"});
  });
}).post(function(req,res){
  "use strict";
  var password        = req.body.password,
      newPassword     = req.body.newPassword,
      reNewPassword   = req.body.reNewPassword,
      passwordHash    = crypto.createHash("sha1").update(new Buffer(password, "binary")).digest('hex'),
      NewPasswordHash = crypto.createHash("sha1").update(new Buffer(newPassword, "binary")).digest('hex'),
      user            = req.session.user.email;

  if(newPassword.length < 8 || newPassword !== reNewPassword){
    res.send({status:200,code:0,message:"������ǿ�Ȳ�����Ҫ����������벻һ�£�"});
    return;
  }

  factory.getOne({
    key:"User",
    body:{
      password:passwordHash
    }
  },function(err,data){
    if(err){
      res.send({status:200,code:0,message:"���������������ԣ�"});
      return;
    }
    if(data && "email" in data && data.email === user){
      factory.update({_id:data._id},{key:"User",body:{password:NewPasswordHash}},function(err,data){
        if(err){
          res.send({status:200,code:0,message:"����ʧ�ܣ����������������ԣ�"});
          return;
        }
        req.session.user = null;
        res.send({status:200,code:1,message:"�����޸ĳɹ�,�����µ�¼��","url":"/"});
      });
    }else{
      res.send({status:200,code:0,message:"����ʧ�ܣ�ԭʼ������������ԣ�"});
      return;
    }
  });
});


// �һ�����
router.route('/forgotPassword').get(function(req, res) {
  "use strict";
  factory.getAll({
    key:"Category"
  },function(err,categories){
    if(err || categories.length<1){
      categories = [];
    }
    res.render('forgotPassword', { title: 'oSpring',"description":"Ϊ�¶���",categories:categories});
  });
}).post(function(req, res) {
  "use strict";
  var email      = req.body.email,
      resetCode  = (Math.random()*10000000000).toFixed(0),
      hash       = crypto.createHash("sha1").update(new Buffer(email+resetCode, "binary")).digest('hex');

  factory.getOne({
    key:"User",
    body:{
      email:email
    }
  },function(err,data){

    if(err){
      res.send({status:200,code:0,message:"�һ�����ʧ�ܣ����������������ԣ�"});
    }
    if(data && "email" in data){
      factory.getOne({
        key:"ResetPW",
        body:{
          email:email
        }
      },function(err,data){
        if(err){
          res.send({status:200,code:0,message:"�һ�����ʧ�ܣ����������������ԣ�"});
        }
        if(data && "email" in data && data.hash){
          sendMail({
            from: config.mail.sendMail,
            to: email,
            title: '���������ʼ�',
            html: '���������������������ӣ�\n\r <a href="' + config.url + '/forgotPassword/'+ data.hash +'">' + config.url + '/forgotPassword/'+ data.hash + '</a>����������������������룡'
          });
          res.send({status:200,code:1,message:"�һ�����ɹ����Ժ�����ȡ�ʼ����������룡"});
        }else{
          factory.update({email:email},{
            key:"ResetPW",
            body:{
              email:email,
              resetCode:resetCode,
              hash:hash
            },
            option:{upsert: true}
          },function(err,data){
            if(err){
              res.send({status:200,code:0,message:"�һ�����ʧ�ܣ����������������ԣ�"});
            }else{
              sendMail({
                from: config.mail.sendMail,
                to: email,
                subject: '���������ʼ�',
                html: '���������������������ӣ�\n\r <a href="' + config.url + '/forgotPassword/'+ hash +'">' + config.url + '/forgotPassword/'+ hash + '</a>����������������������룡'
              });
              res.send({status:200,code:1,message:"�һ�����ɹ����Ժ�����ȡ�ʼ����������룡"});
            }
          });
        }
      });

    }else{
      res.send({status:200,code:0,message:"�һ�����ʧ�ܣ��޴��û��������ԣ�"});
    }
  });
});


// ����������������
router.route('/forgotPassword/:hash').get(function(req, res) {
  "use strict";
  var hash = req.params.hash;

  factory.getAll({
    key:"Category"
  },function(err,categories){
    if(err || categories.length<1){
      categories = [];
    }

    if(hash){
      factory.getOne({
        key:"ResetPW",
        body:{
          hash:hash
        }
      },function(err,data){
        if(err || !data){
          // �������������ʼ���������ҳ��
          //res.render('resetPasswordFill', { title: 'oSpring',"description":"Ϊ�¶���",categories:categories,email:email,resetCode:resetCode});
          //res.redirect("/forgotPassword");
          res.render('forgotPassword', { title: 'oSpring',"description":"Ϊ�¶���",categories:categories,error:"�����������������ʧЧ"});
        }else{
          // ����������
          res.render("resetPassword", { title: 'oSpring',"description":"Ϊ�¶���",categories:categories,hash:hash});
        }
      });
    }else{
      res.redirect("/forgotPassword");
      //res.render('resetPasswordFill', { title: 'oSpring',"description":"Ϊ�¶���",categories:categories,email:email,resetCode:resetCode});
    }
  });
});

// ����������  Ŀǰʵ����©�����ʷǳ��ǳ��ǳ�С
router.post('/resetPassword/:hash',function(req,res){
  "use strict";
  var password     = req.body.password,
      rePassword   = req.body.rePassword,
      hash         = req.body.hash || req.params.hash,
      passwordHash = crypto.createHash("sha1").update(new Buffer(password, "binary")).digest('hex');


  if(password.length < 8 || password !== rePassword){
    res.send({status:200,code:0,message:"������ǿ�Ȳ�����Ҫ����������벻һ�£�"});
    return;
  }
  if(!hash){
    res.send({status:200,code:0,message:"���Ӵ��������ԣ�"});
    return;
  }

  factory.getOne({
    key:"ResetPW",
    body:{
      hash:hash
    }
  },function(err,data){
    var email = data && data.email;
    if(err){
      res.send({status:200,code:0,message:"���������������ԣ�"});
      return;
    }
    if(data && "email" in data && email){
      factory.update({email:email},{key:"User",body:{password:passwordHash}},function(err,data){
        if(err || data.length <1){
          res.send({status:200,code:0,message:"��������ʧ�ܣ����������������ԣ�"});
          return false;
        }
        factory.remove({key:"ResetPW",body:{email:email}},function(err,data){
        });
        res.send({status:200,code:1,message:"��������ɹ�,�����µ�¼��","url":"/"});
      });
    }else{
      res.send({status:200,code:0,message:"��������ʧ�ܣ����Ӵ��������ԣ�"});
      return false;
    }
  });
});

// �����˻�
// �����˻�     /*����ͨ���ȵ�¼��Ȼ���ټ���ķ�������ֹ�����󼤻*/
router.get("/activeAccount/:code",function(req,res){
  "use strict";
  var code  = req.params.code,
      email;
  factory.getOne({key:"User",body:{regCode:code}},function(err,user){
    if(err || !user){
      res.send({status:200,code:0,message:"�˻�����ʧ�ܣ����������������ԣ�"});
    }else{
      email = user.email;
      factory.update({regCode:code,email:email},{key:"User",body:{isActive:true,"regCode":""}},function(err,num){
        if(err || num<1){
          res.send({status:200,code:0,message:"�˻�����ʧ�ܣ�������������¼�˻��ͼ������Ӳ�ƥ�䣬�����ԣ�"});
        }else{
          sendMail({
            from: config.mail.sendMail,
            to: email,
            subject: '����ɹ�',
            html: '��л��ע��'+ config.title +'�������˻��ѳɹ������������ʹ�ã����ʣ�' + config.url
          });
          res.send({status:200,code:1,message:"�˻��ѳɹ������л����ʹ�ã�"});
        }
      });
    }
  });
});
// ���ͼ����ʼ�
router.route("/activeAccount").all(authorize).get(function(req,res){
  "use strict";
  var email    = req.session.user.email,
      duration = config.activeDuration * 60 * 1000,
      msTime   = (new Date).getTime(),
      time;

  factory.getOne({key:"User",body:{email:email}},function(err,user){
    if(err || !user){
      res.send({status:200,code:0,message:"���ͼ����ʼ�ʧ�ܣ����������������ԣ�"});
    }else{
      time = user.activeTime;
      if(time !==0 && (msTime - time <= duration)){
        res.send({status:200,code:0,message:"����Ƶ����ȡ�����ʼ���ϵͳ����ʱ����Ϊ" +  config.activeDuration + "���ӣ���" + ((duration - (msTime - time))/1000).toFixed(0) + "����ȡ��"});
        return false;
      }
      if(user.regCode && !user.isActive){
        sendMail({
          from: config.mail.sendMail,
          to: email,
          subject: 'ע��ɹ�',
          html: '��л��ע��'+ config.title +'�����������ļ������ӣ�\n\r <a href="' + config.url + '/activeAccount/' + user.regCode + '">'+ config.url + '/activeAccount/' + user.regCode +'</a>���������Լ��������˻���'
        });
        factory.update({email: email}, {key: "User", body: {activeTime:msTime}},function(err,num){});
        res.send({status:200,code:1,message:"���ͼ����ʼ��ɹ������Ժ���ȡ�ʼ���������������Լ����˻���"});
      }else{
        res.send({status:500,code:0,message:"���ͼ����ʼ�ʧ�ܣ��벻Ҫ�ظ����󼤻��ʼ���"});
      }
    }
  });
});

// �����ʼ���ַ
// �����µ������ַ�����ͼ����ʼ�
router.route("/email").all(authorize).get(function(req,res){
  "use strict";
  factory.getAll({
    key:"Category"
  },function(err,categories){
    if(err){
      categories = [];
    }
    res.render('admin/email', {categories:categories,cur:"email"});
  });
}).post(function(req,res){
  "use strict";
  var email    = req.session.user.email,
      newEmail = req.body.email,
      regCode  = crypto.createHash("sha1").update(new Buffer(newEmail + (Math.random()*10000000000).toFixed(0), "binary")).digest('hex');

  if(email === newEmail){
    res.send({status:200,code:0,message:"��Ҫ��ƤŶ�����û���޸������"});
    return false;
  }

  factory.getOne({key:"User",body:{email:newEmail}},function(err,user){
    if(err || user){
      res.send({status:200,code:0,message:"��Ҫ��ƤŶ�����ʼ���ַ�Ѿ���ʹ�ã�"});
    }else{
      factory.getOne({key:"User",body:{email:email}},function(err,user) {
        if (err || !user) {
          res.send({status: 200, code: 0, message: "��������ʧ�ܣ�����������"});
        } else if(user.changeTimes >= config.changeTimes){
          res.send({status:200,code:0,message:"��������ʧ�ܣ��Ѿ�������������������������"});
        }else{
          factory.update({email: email}, {key: "User", body: {changeEmail:newEmail,"regCode":regCode,"isActive":false}},function(err,num){
            if(err || num <1){
              res.send({status: 200, code: 0, message: "��������ʧ�ܣ�����������"});
            }else{
              sendMail({
                from: config.mail.sendMail,
                to: newEmail,
                subject: '�����ʼ����¼����˻�',
                html: '��л��ʹ��' + config.title + '����������������ļ������ӣ�\n\r <a href="' + config.url + '/updateEmail/' + regCode + '">' + config.url + '/updateEmail/' + regCode + '</a>���������Լ��������˻���'
              });
              res.send({status: 200, code: 1, message: "�����������ַ���ͼ����ʼ��ɹ������Ժ���ȡ�ʼ���������������Լ����˻���"});
            }
          });

        }
      });
    }
  });
});

// �����ʼ���ַ
// ����������� �������ʼ���ַ
router.route("/updateEmail/:code").all(authorize).get(function(req,res){
  "use strict";
  var code  = req.params.code;

  if(!code){
    factory.getAll({
      key:"Category"
    },function(err,categories){
      if(err){
        categories = [];
      }
      res.render('admin/error', {categories:categories,err:"����������򼤻��������д������ԣ�"});
    });
    return false;
  }

  factory.getOne({key:"User",body:{regCode:code}},function(err,user){
    if(err || !user){
      res.send({status:200,code:0,message:"����������򼤻��������д������ԣ�"});
    }else{

      factory.update({regCode:code}, {key: "User", body:{email:user.changeEmail,changeTimes:user.changeTimes+1,regCode:"","isActive":true}},function(err,num){
        if(err || num <1){
          res.send({status: 200, code: 0, message: "��������ʧ�ܣ�����������"});
        }else{
          if(user.regCode && !user.isActive){
            sendMail({
              from: config.mail.sendMail,
              to: user.changeEmail,
              subject: '������³ɹ�',
              html: '��л����'+ config.title +'�ĺ񰮣����������ѳɹ���������������ʹ�ã����ʣ�' + config.url
            });
            req.session.user = null;
            res.send({status: 200, code: 1, message: "���������ѳɹ���������������ʹ�ã������µ�¼��"});
          }else{
            res.send({status: 500, code: 0, message: "��������ʧЧ���벻Ҫ�ظ����������Ŷ��"});
          }
        }
      });
    }
  });

});

//��¼ ע��
router.get('/login', function(req, res) {
  "use strict";

  if(req.session.user){
    res.redirect(goBack(req.headers.referer));
  }
  res.render('login');
});

router.route('/login').post(function(req, res) {
  "use strict";
  if(req.session.user){
    res.send({status:403,message:"�벻Ҫ�ظ���¼��"});
  }
  var email    = req.body.email,
      password = req.body.password,
      hash     = crypto.createHash("sha1").update(new Buffer(password, "binary")).digest('hex');

  factory.getOne({
    key:"User",
    body:{
      email:email,
      password:hash
    }
  },function(err,data){

    if(err){
      res.send({status:200,code:0,message:"��¼ʧ�ܣ����������������ԣ�"});
    }
    if(data && "email" in data){

      req.session.user = data;

      res.send({status:200,code:1,message:"��¼�ɹ���","url":goBack(req.headers.referer)});
    }else{
      res.send({status:200,code:0,message:"��¼ʧ�ܣ��޴��û���������������ԣ�"});
    }
  });
});




router.get('/register', function(req, res) {
  "use strict";
  if(req.session.user){
    res.redirect(goBack(req.headers.referer));
  }
  res.render('register');

});

router.post('/register', function(req, res) {
  "use strict";
  var email      = req.body.email,
      password   = req.body.password,
      repassword = req.body.repassword,
      hash       = crypto.createHash("sha1").update(new Buffer(password, "binary")).digest('hex'),
      regCode    = crypto.createHash("sha1").update(new Buffer(email + (Math.random()*10000000000).toFixed(0), "binary")).digest('hex');

  if(email.length <5 || !/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(email) || password.length < 8 || password !== repassword){
    res.send({status:200,message:"�û��������벻���Բ�����Ҫ��"});
    return;
  }

  factory.getOne({
    key:"User",
    body:{
      email:email
    }
  },function(err,data){
    if(err){
      res.send({status:200,code:0,message:"���������������ԣ�"});
      return;
    }

    if(data && data.email){
      res.send({status:200,code:0,message:"�Ѵ��ڴ��û���"});
      return;
    }

    factory.save({
      key:"User",
      body:{
        email: email,
        username: email,
        password: hash,
        age: 18,
        regTime:(new Date()).getTime(),
        regIp : req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        sex:null,
        role:5,
        score:0,
        regCode:regCode,
        isActive:0,
        activeTime:0,
        changeEmail:email,
        changeTimes:0
      }
    },function(err,data){

      if(err){
        res.send({status:200,code:0,message:err});
      }
      req.session.user = data;
      sendMail({
        from: config.mail.sendMail,
        to: email,
        subject: 'ע��ɹ�',
        html: '��л��ע��'+ config.title +'�����������ļ������ӣ�\n\r <a href="' + config.url + '/activeAccount/' + regCode + '">'+ config.url + '/activeAccount/' + regCode +'</a>���������Լ��������˻���'
      });
      res.send({status:200,code:1,message:"ע��ɹ����Ժ����ѯ���������Լ����˻���","url":goBack(req.headers.referer)});
    });


  });

});

router.get('/logout', function(req, res) {
  "use strict";
  if(req.session.user){
    req.session.user = null;
  }
  res.redirect(goBack(req.headers.referer));
});

module.exports = router;
