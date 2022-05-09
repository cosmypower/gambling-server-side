var login = require("../user/login.js");
var chat = require("../../libs/chat.js");

module.exports = {
    run(socket, client, message) {
      if (!login.connected_sockets[client.id]) return;
      if (message.length <= 1 && message.length > 128) return;

      let client_id = login.connected_sockets[client.id].user_id;
      var aUser = login.connected_users[client_id];

      if (aUser) {
        chat.addLog(aUser.data.id, aUser.data.username, aUser.data.admin_level, message);

        client.broadcast.emit("receivedChatMessage", { user: aUser.data, msg: message });
      }
    }
};