var game = require("../../libs/game.js");
var chat = require("../../libs/chat.js");
var users = require("./login.js");

module.exports = {
    async run(socket, client, account) {
        if (!users.connected_sockets[client.id]) return;
        let client_id = users.connected_sockets[client.id].user_id;

        var total_bets = await game.getTotalBets(client_id, false);
        var total_messages = await chat.getTotalMessages(client_id);
        var total_cashouts = await game.getTotalBets(client_id, true);

        var bets_value = await game.getBetsSum(client_id);

        client.emit("receivedInfo", {counts: {bets: total_bets.length, cashouts: total_cashouts.length, messages: total_messages.length }, sums: {bets: bets_value}});
    }
}