var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var smtpTransport = require("nodemailer-smtp-transport");
var smtpTransport = nodemailer.createTransport(smtpTransport({
    host : "smtp.gmail.com",
    secureConnection : false,
    port: 587,
    auth : {
        user : "donotreply.testing.web@gmail.com",
        pass : "micr0s0ft7"
    }
}));

router.route('/sendemail').post(function(req, res) {
var mailData = {
    from: 'donotreply.testing.web@gmail.com', // sender address
    to: req.body.toemail, // list of receivers
    subject: req.body.subject, // Subject line
    text: req.body.body, // plaintext body
    html: '<b>'+req.body.body+'</b>' // html body
};

// send mail with defined transport object
smtpTransport.sendMail(mailData, function(err, info){
    if (err) return res.send({ "status": "Error","message": err });
    return res.send({ "status": "Success", "message": "Email sent successfully", "response": info.response });
});
});
module.exports = router;