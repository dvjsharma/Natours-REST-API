const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({ //no matter what email service you use, its independent
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Divij Sharma <test@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html: can specify this later
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
