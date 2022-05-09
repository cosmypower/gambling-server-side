var login = require("../user/login.js");
var utils = require("../../libs/utils.js");
var console = require("../../libs/console.js");
var User = require("../../libs/user.js");

module.exports = {
    async run(socket, client, crash, message) {
      if (!login.connected_sockets[client.id]) return;

      let client_id = login.connected_sockets[client.id].user_id;
      var aUser = login.connected_users[client_id];

      if (aUser) {
        aUser.data = await User.getInfo(client_id);
        if (!aUser.data) return;

        var bet = await crash.cashOut(socket, aUser);

        if (!bet) {
          client.emit("notification", {type: "error", msg: "Couldn't cashout, maybe the game started."});
        }
      }
    }
};