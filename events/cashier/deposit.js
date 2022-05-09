var login = require("../user/login.js");
var cashier = require("../../libs/cashier.js");
var User = require("../../libs/user");

module.exports = {
    // Currently in maintenance
    async run(socket, client, crash, data) {
        return;
        
        if (!login.connected_sockets[client.id]) return;

        let client_id = login.connected_sockets[client.id].user_id;
        var aUser = login.connected_users[client_id];
        if (!aUser) return;

        var address = await cashier.deposit(data.crypto);

        client.emit("deposit", {type: "address", content: {address}});
    }
};