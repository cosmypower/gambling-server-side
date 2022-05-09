var game = require("../../libs/game.js");

module.exports = {
    async run(socket, client, crash, data) {
        if (data.round == "current") {
            crash.getCurrentRoundInfo(client);
        } else {
            var round_info = await game.getRoundInfo(data.round);

            if (round_info) {
                client.emit('game', {type: 'round_info', content: round_info });
            } else {
                client.emit('game', {type: 'round_info', content: "error" });
            }
        }
    }
};