const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendLoginOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Hospital Management System" <${process.env.SMTP_USER}>`,

    to: email,

    subject: "Your Login Verification Code",

    text: `Your login verification code is ${otp}. This code will expire in 5 minutes.`,

    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hospital Management System</h2>

        <p>Your login verification code is:</p>

        <h1 style="letter-spacing: 8px;">
          ${otp}
        </h1>

        <p>
          This code will expire in <strong>5 minutes</strong>.
        </p>

        <p>
          If you did not try to log in, please contact your administrator.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendLoginOTP,
};