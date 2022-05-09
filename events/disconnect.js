var users = require("./user/login.js");
var utils = require("../libs/utils.js");
var console = require("../libs/console.js");

module.exports = {
    run(socket, client, crash, data) {
        if (!users.connected_sockets[client.id]) return;
        let client_id = users.connected_sockets[client.id].user_id;

        delete users.connected_users[client_id];
        delete users.connected_sockets[client.id];

        utils.sendWebsiteInfo(socket, users.connected_users);
    }
};