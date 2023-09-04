const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
  // 1) create Transporter
  const Transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    // port: 587,
    // host: process.env.EMAIL_HOST,
    // port: process.env.EMAIL_PORT,
    // secure: false,
    auth: {
      user: 'putt4purpose@gmail.com',
      pass: 'ogqromeqlrcjndsw',
    },
  });

  //   2) define email options
  const mailOptions = {
    from: 'hello@jonas.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) acctuaaly send email

  await Transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
