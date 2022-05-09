var utils = require("../../libs/utils.js");
var User = require("../../libs/user.js");
var users = require("./login.js");
var console = require("../../libs/console.js");

module.exports = {
      
    async run(socket, client, session_id) {
        if (!users.connected_sockets[client.id]) return;
        let client_id = users.connected_sockets[client.id].user_id;

        if (await User.logout(users.connected_users[client_id].session_id)) {   
            delete users.connected_users[client_id];

            users.connected_sockets = users.connected_sockets.filter(val => val.user_id == client_id);

            client.emit("logout");
            utils.sendWebsiteInfo(socket, users.connected_users);
        } else {
            var sockets = users.connected_users[client_id].sockets;

            if (sockets) {
                sockets.forEach(socket => {
                    socket.emit("notify", {type: "error", msg: "Couldn't logout."});
                });
            } else {
                client.emit("notify", {type: "error", msg: "Couldn't logout."});
            }
        }
    }
};