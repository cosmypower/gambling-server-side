const nodemailer = require("nodemailer");

module.exports = {
    initialiseTransporter() {
        return nodemailer.createTransport({
            host: "mail.privateemail.com",
            port: 465,
            secure: true, 
            auth: {
                user: 'admin@edgecrash.com',
                pass: 'StefCosmy2005XBH$',
            },
        });
    },

    async sendEmail(to, subject, html, text) {
        var transporter = module.exports.initialiseTransporter();
        if (!transporter) return false;

        return await transporter.sendMail({
            from: '"EdgeCrash | Crypto Casino" <admin@edgecrash.com>',
            to,
            subject,
            text,
            html
        });
    }
}