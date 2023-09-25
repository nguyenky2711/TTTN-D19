const nodemailer = require('nodemailer');

function sendConfirmationEmail(email, confirmationLink) {
    const transporter = nodemailer.createTransport({
        // Configure your email service provider details here
        // For example, using Gmail SMTP:
        service: 'gmail',
        auth: {
            user: 'tatky9716@gmail.com',
            pass: 'gashmniuqklesuyd'
        }

    });

    const mailOptions = {
        from: 'tatky0716@gmail.com',
        to: email,
        subject: 'Account Confirmation',
        html: `<!DOCTYPE html>
        <html>
        <head>
          <title>Account Confirmation</title>
        </head>
        <body>
          <h1>Account Confirmation </h1>
          <p>Thank you for registering an account. Please click the button below to confirm your account:</p>
          <a href="${confirmationLink}" style="background-color: #4CAF50;color: white; padding: 10px 20px; border:none; cursor: pointer; text-decoration: none"  }>Confirm account <a/>
          </body>
        </html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending confirmation email:', error);
        } else {
            console.log('Confirmation email sent:', info.response);
        }
    });
}

function sendResetPasswordEmail(email, confirmationLink) {
    const transporter = nodemailer.createTransport({
        // Configure your email service provider details here
        // For example, using Gmail SMTP:
        service: 'gmail',
        auth: {
            user: 'tatky9716@gmail.com',
            pass: 'gashmniuqklesuyd'
        }

    });

    const mailOptions = {
        from: 'tatky0716@gmail.com',
        to: email,
        subject: 'Reset password',
        html: `<!DOCTYPE html>
        <html>
        <head>
          <title>Reset password</title>
        </head>
        <body>
          <h1>>Reset password</h1>
          <p>Please click the button below to reset your password:</p>
          <a href="${confirmationLink}" style="background-color: #4CAF50;color: white; padding: 10px 20px; border:none; cursor: pointer; text-decoration: none; margin-top: 30px; display: inline-block " }>Click here to reset your password<a/>
          </body>
        </html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending reset email:', error);
        } else {
            console.log('Confirmation email sent:', info.response);
        }
    });
}
module.exports = { sendConfirmationEmail, sendResetPasswordEmail };
