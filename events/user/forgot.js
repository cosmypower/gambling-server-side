var User = require("../../libs/user.js");
var login = require("./login.js");
var Mail = require("../../libs/mailer.js");

const bcrypt = require("bcrypt");

module.exports = {
    async modifyPassword(client, data) {
        if (!data.token || !data.password) return client.emit('forgot', {error: true, msg: 'Couldn\'t change password.'});
        
        bcrypt.hash(data.password, 11, async (err, hash) => {
            var updated = await User.updatePassword(data.token, hash);

            if (updated) {
                Mail.sendEmail(updated.email, '🔑 Your password has been changed',
                 '<p>Hello ' + updated.username + ', we inform you that you have successfully changed your password.</p><p>If you haven\'t requested a password change, please contact the support team.</p>',
                 'Hello ' + updated.username + ', we inform you that you have successfully changed your password. If you haven\'t requested a password change, please contact the support team.'
                );

                client.emit("forgot", {error: false, changed_password: true});
            }
            else return client.emit('forgot', {error: true, msg: 'Couldn\'t change password.'});
        });
    },

    async verifyToken(client, data) {
        if (!data.token) return client.emit('forgot', {error: true, msg: 'Couldn\'t load the token.'});

        var user = await User.receiveAccountByToken(data.token);

        if (!user) return client.emit('forgot', {error: true, msg: 'Invalid or expired token. Please try again'});

        client.emit('forgot', {error: false, user});
    },

    async createToken(client, account) {
        if (!account.username || !account.email) return client.emit("notify", {type: "error", msg: 'Couldn\'t send forgot password request.'});;

        var created_request = await User.createForgotRequest(account.username, account.email);

        if (created_request) {
            client.emit("notify", {type: "success", msg: "Sent password change request to account email that belongs to requested data."});

            if (created_request.sent) {
                var token = 'https://edgecrash.com/forgot/' + created_request.token;
                Mail.sendEmail(account.email, '🔑 Reset your password',
                    '<p>Hello ' + account.username + ', in order to reset your password, please click on the link below./p><br/><a href="' + token + '">' + token + '</a></br><p> If you didn\'t request this, please ignore this email. This link is available for 24 hours.</p>',
                    'Hello ' + account.username + ', in order to reset your password, please click on the link below. ' + token + '.  If you didn\'t request this, please ignore this email. This link is available for 24 hours.'
                );
            }
        } else {
            client.emit("notify", {type: "error", msg: 'Couldn\'t send forgot password request.'});
        }
    },

    async run(socket, client, data) {
        if (!data) return;

        if (data.type == "create") return module.exports.createToken(client,data);
        else if (data.type == "verify") return module.exports.verifyToken(client, data);
        else return module.exports.modifyPassword(client, data);
    }
};