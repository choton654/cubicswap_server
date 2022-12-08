const nodemailer = require("nodemailer");

const sendEmail = (options) => {
  //   let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL,
      pass: process.env.PASS,
    },
  });

  const message = {
    from: process.env.GMAIL,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  //   const info = await transporter.sendMail(message);
  transporter
    .sendMail(message)
    .then(() => {
      //("email send");
    })
    .catch((err) => {
      //("error occurred", err);
    });

  //   //("Message sent: %s", info.messageId);
  //   //("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
