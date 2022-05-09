var login = require("../user/login.js");
var utils = require("../../libs/utils.js");
var console = require("../../libs/console.js");
var User = require("../../libs/user.js");

module.exports = {

    /* Message data format:
     *  {bet_amount: integer; auto_payout: float}
    **/
    async run(socket, client, crash, message) {
      if (!login.connected_sockets[client.id]) return;

      let client_id = login.connected_sockets[client.id].user_id;
      var aUser = login.connected_users[client_id];

      if (aUser) {
        aUser.data = await User.getInfo(client_id);
        if (!aUser.data) return;

        var created_bet = await crash.addBet(socket, aUser, message.bet_amount, message.auto_payout ? message.auto_payout : 0);

        if (!created_bet) {
          client.emit("notification", {type: "error", msg: "Couldn't add bet! Not enough balance, already placed a bet or game already started."});
        }
      }
    }
};