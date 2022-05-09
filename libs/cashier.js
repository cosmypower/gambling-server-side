var sql = require("./mysql");
var electrum = require("./electrum");
var user_class = require("./user.js");

module.exports = {
    async withdraw(client, user_id, user_balance, address, amount, priority, crypto) {
        return new Promise(async (resolve, reject) => {
            var user_bal = await user_class.updateBalance(client, user_id, parseFloat(user_balance - amount));
            if (!user_bal) return resolve(false);

            electrum.getFeeRate(priority, (fee) => {
                if (!fee) return resolve(false);

                electrum.sendWithoutFee(address, amount, (tmp_hex) => {
                    console.log(tmp_hex);
                    if (!tmp_hex) return resolve(false);
                    var fee_rate = (fee / 100000000) * tmp_hex.length / 2;
    
                    electrum.sendBTC(address, amount, fee_rate, (hex) => {
                        if (!hex) return resolve(false);
                      
                        electrum.broadcast(hex, (transaction_id) => {
                            if (!transaction_id) return resolve(false);
                            
                            sql.query("INSERT INTO `cashier` (`sent_address`, `txid`, `amount`, `fee`, `completed`) VALUES (?, ?, ?, ?, ?)", [address, transaction_id, amount, fee_rate, 1], (err, result) => {
                                if(err) return resolve(false);

                                console.log("[+]" + " Succesfully sent! " + "(https://blockchair.com/bitcoin/transaction/" + transaction_id + ")");

                                resolve(transaction_id);
                            });
                        })
                    });
                })
            });
        });
    },

    async deposit(crypto) {
        return new Promise((resolve, reject) => {
            electrum.retrieveAddress((address) => {
                resolve(address);
            });
        });
    }
}
