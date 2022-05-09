var utils = require("../../libs/utils.js");
var User = require("../../libs/user.js");
var login = require("./login.js");
var console = require("../../libs/console.js");

module.exports = {
    async run(socket, client, account) {
        utils.sendWebsiteInfo(socket, login.connected_users);

        var user = await User.getSession(account.session_id, client.request.connection.remoteAddress, account.user_agent);

        if (user) {
            if (login.connected_users.hasOwnProperty(user.id)) {
                login.connected_users[user.id].sockets.push(client);
            } else {
                const aUser = { sockets: [ client ], data: user, session_id: account.session_id };

                login.connected_users[user.id] = aUser;
            }

            login.connected_sockets[client.id] = {user_id: user.id};

            client.emit("login", { id: user.id, admin_level: user.admin_level, networth: user.networth, username: user.username, btc: user.btc, session_id: account.session_id });
            
            utils.sendWebsiteInfo(socket, login.connected_users);
        }
    }
};