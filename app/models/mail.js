const nodemailer = require("nodemailer");
const config = require('config');

var transporter = nodemailer.createTransport({
    host: "mail.reverentengineer.com",
    port: 587,
    secure: false,
    auth: {
      user: config.get('mailUser'),
      pass: config.get('mailPassword')
    }
});

module.exports = transporter;
