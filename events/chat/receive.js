var login = require("../user/login.js");
var chat = require("../../libs/chat.js");

module.exports = {
    async sendChatPacket(client, chatId) {
        var chatMsg = await chat.getLastMessages(10, chatId);
        
        client.emit("chatMessages", { chatId: chatId, list: chatMsg });
    },

    run(socket, client, chatId) {
      if (chatId !== 99) {
        const aUser = login.connected_users[client.id];

        if (aUser) {
            if (aUser.data.admin_level > 0)
                this.sendChatPacket(client, chatId);
        }
      } else {
      }

      this.sendChatPacket(client, chatId);
    }
};