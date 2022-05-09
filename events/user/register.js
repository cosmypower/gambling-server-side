var utils = require("../../libs/utils.js");
var User = require("../../libs/user.js");
var Mail = require("../../libs/mailer.js");
var login = require("./login.js");
var crypto = require('crypto-price');
var bcrypt = require('bcrypt');

module.exports = {
      
    async run(socket, client, account) {
        if (!account) return;
        if (!account.password || !account.username || !account.email) return;

        bcrypt.hash(account.password, 11, async (err, hash) => {
            var registered = await User.register(client.request.connection.remoteAddress, account.email, hash, account.username);

            if (registered.succesful) {
                login.run(socket, client, {username: account.username, password: account.password, user_agent: account.user_agent});
                client.emit("notify", {type: "success", msg: "Succesfully registered!"});

                Mail.sendEmail(account.email, '❤ Account successfully registered',
                 '<span>Welcome to <b>EdgeCrash</b>!, </span><br/> <p>Hello ' + account.username + ', we are happy to inform you that you have successfully registered.</p>',
                 'Hello ' + account.username + ', we are happy to inform you that you have been successfully registered.'
                );
            } else {
                client.emit("notify", {type: "error", msg: registered.error + '.'});
            }
        });

    }
};