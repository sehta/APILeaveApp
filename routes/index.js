var express = require('express');
var router = express.Router();
var mongojs = require('mongojs')
/* var bcrypt   = require('bcrypt-nodejs'); */
var config = require('../config'); // get our config file
var db = mongojs(config.database);
var User = db.collection('user');
var ObjectId = mongojs.ObjectID;
var app = require('../app');
var jwt = require('jsonwebtoken');
var bCrypt = require('bcrypt-nodejs');
var smtp = require('../smtp');
var smtpProtocol = smtp.smtpTransport;
var crypto = require('crypto');
var ForgotRequest = db.collection('forgotrequest');

var isValidPassword = function (user, password) {
    return bCrypt.compareSync(password, user.password);
}
var createHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

function cryptoRandomNumber(minimum, maximum) {
    var distance = maximum - minimum;
    var maxBytes = 6;
    var maxDec = 281474976710656;
    var randbytes = parseInt(crypto.randomBytes(maxBytes).toString('hex'), 16);
    var result = Math.floor(randbytes / maxDec * (maximum - minimum + 1) + minimum);

    if (result > maximum) {
        result = maximum;
    }
    return result;
}

router.route('/login').post(function (req, res) {

    try {
        if (!req.body.username || !req.body.password) {
            return res.send({ "status": "Error", "message": "missing a parameter" });
        }
        else {
            User.findOne({ 'email': req.body.username }, function (err, user) {

                // In case of any error, return using the done method
                if (err) return res.send({ "status": "Error", "message": err });
                // Username does not exist, log the error and redirect back
                if (!user) {
                    return res.send({ "status": "Error", "message": "Invalid Username" });
                }
                // User exists but wrong password, log the error 
                try {
                    if (!isValidPassword(user, req.body.password)) {
                        return res.send({ "status": "Error", "message": "Invalid Password" });
                    }
                } catch (e) {
                    return res.send({ "status": "Error", "message": e });
                }
                
                // User and password both match, return user from done method which will be treated like success

                var token = jwt.sign(user, req.app.get('superSecret'), {
                    expiresIn: 86400 // expires in 24 hours
                });
                user.token = token;
                return res.send({ "status": "Success", "message": "User Found", "user": user });
                // return res.json({'status': 'Success','message':'User Found', 'user':user});
            });
            // return res.send({"status": "Success", "message": "Get required attributes"});
        }
    } catch (err) {
        return res.send({ "status": "Error", "message": "System Error" });
    }
    
});
router.route('/').get(function (req, res) {
    res.send("Welcome to Orion yy Leave Management APIs");
});



// Forget Password
router.route('/forgot/:id').get(function (req, res) {
    console.log(req.params.id)
    if (!req.params.id) {
        return res.send({ "status": "Error", "message": "missing email" });
    }
    User.findOne({ 'email': req.params.id }, function (err, user) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!user) {
            return res.send({ "status": "Error", "message": "User not found" });
        }
        else {
            //  return res.send({ "status": "Success", "message": "User found by user id", "user": user });
           
            var getToken = cryptoRandomNumber((Number.MAX_SAFE_INTEGER - 281474976710655), Number.MAX_SAFE_INTEGER);
            var forgotCollection = {
                email: req.params.id,
                requeston: new Date(),
                validhours: 1,
                token: getToken
            };
            var mailData = {
                from: 'donotreply.testing.web@gmail.com', // sender address
                to: req.params.id, // list of receivers
                subject: "Forgot Password Request", // Subject line
                text: "Forgot Password", // plaintext body
                html: '<b>Your Forgot Password Request Token: <br />' + getToken + ' <br /> . This token is valid for one time use. </b>' // html body
            };
            ForgotRequest.save(forgotCollection, function (err, user) {
                smtpProtocol.sendMail(mailData, function (err, info) {
                    if (err) return res.send({ "status": "Error", "message": err });
                    return res.send({ "status": "Success", "message": "Email sent successfully", "response": info.response });
                });
            });
        }

    });
});

//
router.route('/forgot').post(function (req, res) {

    try {
        if (!req.body.email || !req.body.token || !req.body.password) {
            return res.send({ "status": "Error", "message": "missing a parameter" });
        }
        else {
            ForgotRequest.findOne({ 'email': req.body.email, 'token': parseInt(req.body.token) }, function (err, frequest) {
                console.log(frequest)
                // In case of any error, return using the done method
                if (err) return res.send({ "status": "Error", "message": err });
                // Username does not exist, log the error and redirect back
                if (!frequest) {
                    return res.send({ "status": "Error", "message": "Invalid Request!" });
                }
                else {
                    var validhours = frequest.validhours;
                    var createdon = new Date(frequest.requeston);
                    createdon.setHours(createdon.getHours() + 1);
                    var startDate = new Date();
                    console.log(createdon)
                    console.log(startDate)
                    if (startDate <= createdon) {
                        User.findOne({ 'email': req.body.email }, function (err, user) {
                            if (err) return res.send({ "status": "Error", "message": err });
                            if (!user) {
                                return res.send({ "status": "Error", "message": "User not found", "user": user });
                            }
                            else {
                                User.update({ 'email': req.body.email }, { $set: { 'password': createHash(req.body.password) }}, function (err, results) {
                                    if (err) return res.send({ "status": "Error", "message": err });
                                    else {
                                        return res.send({ "status": "Success", "message": "User password updated successfully" });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        return res.send({ "status": "Error", "message": "Token has been expired !" });
                    }
                }
                

                

                
                // return res.json({'status': 'Success','message':'User Found', 'user':user});
            });
            // return res.send({"status": "Success", "message": "Get required attributes"});
        }
    } catch (err) {
        return res.send({ "status": "Error", "message": "System Error" });
    }

});

module.exports = router;


