var nodemailer = require('nodemailer');
var smtpTransport = require("nodemailer-smtp-transport");
var smtpTransport = nodemailer.createTransport(smtpTransport({
    host: "smtp.gmail.com",
    secureConnection: true,
    port: 587,
    auth: {
        user: "donotreply.testing.web@gmail.com",
        pass: "micr0s0ft7"
    }
}));

module.exports = {

    'smtpTransport': smtpTransport,
   
};