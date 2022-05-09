var crashGame = require("../../libs/game.js");

module.exports = {
    async sendGamesPacket(client) {
        var history = await crashGame.getLastGames(100);
        
        client.emit("gamesHistory", { history });
    },

    run(socket, client, crash) {
        this.sendGamesPacket(client, crash);
    }
};