var utils = require("../../libs/utils.js");
var User = require("../../libs/user.js");
var console = require("../../libs/console.js");

var crypto = require('crypto-price');

module.exports = {
    connected_users: [],
    connected_sockets: [],
      
    async run(socket, client, account) {
        var user = new User.class(account.username, account.password);
        if (user) {
          var loginInfo = await user.login(account.user_agent, client.request.connection.remoteAddress);
          var info = loginInfo.data;

          if (info) {   
            if (this.connected_users.hasOwnProperty(info.id)) {
              this.connected_users[info.id].sockets.push(client);
            } else {
              const aUser = { sockets: [ client ], data: info, session_id: loginInfo.session_id };
    
              this.connected_users[info.id] = aUser;

              console.addNew(info.username.yellow + " logged in to the server. Online players: " + utils.array_len(this.connected_users) + " (Session ID: ".green + loginInfo.session_id.toString().green + ")".green + ".");

              utils.sendWebsiteInfo(socket, this.connected_users);
            }

            this.connected_sockets[client.id] = {user_id: info.id};
            
            client.emit("login", { admin_level: info.admin_level, networth: info.networth, btc: info.btc, username: info.username, session_id: loginInfo.session_id });
            client.emit("notify", { type: "success", msg: "Welcome back, " + info.username + "!" });
          } else {
            client.emit("notify", {type: "error", msg: "Incorrect password or username. Please try again later."});
          }
        }
    }
};