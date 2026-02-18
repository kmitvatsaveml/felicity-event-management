const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: '"Felicity Events" <' + process.env.EMAIL_USER + '>',
      to,
      subject,
      html
    });
    console.log('Email sent to ' + to);
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
};

module.exports = sendEmail;
