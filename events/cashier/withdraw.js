var login = require("../user/login.js");
var cashier = require("../../libs/cashier.js");
var User = require("../../libs/user");

module.exports = {
    // Currently in maintenance
    async run(socket, client, crash, message) {
        return;
        
        if (!login.connected_sockets[client.id]) return;

        let client_id = login.connected_sockets[client.id].user_id;
        var aUser = login.connected_users[client_id];
        if (!aUser) return;
        
        var tx_id = await cashier.withdraw(client, client_id, aUser.data.btc, message.address, message.amount, message.priority, message.crypto);
        
        if (tx_id) {
            client.emit("withdrawn", {txid: tx_id});
        }
    }
};