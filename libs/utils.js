var login = require("../events/user/login.js");
var currency = require('crypto-price');

module.exports = {
    array_len(arr) {
        var count = 0;
        for (var k in arr) {
          if (arr.hasOwnProperty(k)) {
            count++;
          }
        }
        return count;
    },


    async getCurrencyPrice(base, crypto) {
      return new Promise((resolve, reject) => {
        currency.getCryptoPrice(base, crypto).then(obj => {
          console.log(obj);
          resolve(parseFloat(obj.price));
        }).catch(err => {
          resolve(0);
        })
      });
    },

    async sendWebsiteInfo(socket, users) {
      var btc = await module.exports.getCurrencyPrice("USD", "BTC");
      var eth = await module.exports.getCurrencyPrice("USD", "ETH");
      var ltc = await module.exports.getCurrencyPrice("USD", "LTC");

      var max_profit = 1000;

      socket.emit("getWebsiteInfo", { online_players: module.exports.array_len(users), crypto: {btc, eth, ltc }, max_profit});
    }
}