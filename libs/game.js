var sql = require("./mysql");
var User = require("./user");
const crypto = require("crypto");

module.exports = {
    server_seed: "50ad2457a8843d9e98eaf9cc9c6bd0af5cafa08285fbc08b4f4820b71474b675",


    createGame(hash, bets_value, bets_length, bust) {
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO `games` (`hash`, `bets_count`, `bets_value`, `bust`) VALUES (?, ?, ?, ?);", [hash, bets_length, bets_value, bust], (err, result) => {
                if(err) return resolve(false);

                resolve(true);
            });
        })
    },

    async cashOut(sockets, game_id, user_id, user_balance, chips, payout) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `bets` WHERE `cashout`>0 AND `game_id`=? AND `user_id`=?", [game_id, user_id], async (err, result) => {
                if (err) return resolve(false);
                if (result.length > 0) return resolve(false);

                sql.query("UPDATE `bets` SET `cashout`=? WHERE `game_id`=? AND `user_id`=?", [payout, game_id, user_id], async (err, result) => {
                    if(err) return resolve(false);

                    await User.updateNetworth(user_id, parseFloat(chips));

                    if (await User.updateBalance(sockets, user_id, parseFloat(user_balance + chips))) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
                
            });
        })
    },

    async createBet(socket, sockets, game_id, user_id, username, user_balance, chips, payout) {
        return new Promise(async (resolve, reject) => {
            sql.query("INSERT INTO `bets` (`game_id`, `user_id`, `username`, `bet`, `payout`) VALUES (?, ?, ?, ?, ?);", [game_id, user_id, username, chips, payout], async (err, result) => {
                if(err) return resolve(false);

                await User.updateNetworth(user_id, -parseFloat(chips));
                
                if (await User.updateBalance(sockets, user_id, parseFloat(user_balance - chips))) {
                    socket.emit("game", {type: "placed_bet", content: { user: {user_id, username}, game_id, chips } });

                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        })
    },

    getLastGameID() {
        return new Promise((resolve, reject) => {
            sql.query("SELECT MAX(Id) AS count FROM games", (err, result) => {
                if(err) return resolve(0);
                if (result == undefined || result == null) return resolve(0);
                
                resolve(result[0].count);
            });
        })
    },

    getLastGames(count) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM games ORDER BY id DESC LIMIT ?", [count], (err, result) => {
                if(err) return resolve(0);
                if (result == undefined || result == null) return resolve(0);
                
                resolve(result);
            });
        })
    },

    async getRoundInfo(game_id) {
        return new Promise(async (resolve, reject) => {
            sql.query("SELECT * FROM games WHERE id=?", [game_id], async (err, result) => {
                if(err) return resolve(0);
                if (result == undefined || result == null || result.length == 0) return resolve(0);
                
                resolve({
                    hash: result[0].hash,
                    crashed_at: result[0].bust,
                    timestamp: result[0].created_at,

                    bets_info: {
                        value: result[0].bets_value,
                        count: result[0].bets_count,
                    },
                    bets: await this.getGameBets(game_id)
                });
            });
        })
    },

    getGameBets(game_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM bets WHERE game_id=? ORDER BY bet DESC", [game_id], (err, result) => {
                if(err) return resolve(0);
                
                resolve(result);
            });
        })
    },

    getTotalBets(user_id, cashed_out) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM bets WHERE user_id=? " + (cashed_out == true ? "AND cashout > 0" : ""), [user_id], (err, result) => {
                if(err) return resolve(0);
                if (result == undefined || result == null) return resolve(0);
                
                resolve(result);
            });
        })
    },

    getBetsSum(user_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT SUM(bet) AS bet FROM bets " + (user_id == 0 ? "" : "WHERE user_id=?"), [user_id], (err, result) => {
                if(err) return resolve(0);
                if (result == undefined || result == null) return resolve(0);
                
                resolve(result[0].bet);
            });
        })
    },

    getHash(game_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `hashes` WHERE id=?", [game_id], (err, result) => {
                if(err) return resolve("");
                if (result.length == 0) return resolve("");
                
                resolve(result[0].hash);
            });
        })
    },

    getTotalPlayers(game_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `hashes` WHERE id=?", [game_id], (err, result) => {
                if(err) return resolve("");
                if (result.length == 0) return resolve("");
                
                resolve(result[0].hash);
            });
        })
    },

    generateHmac(salt) {
        return crypto.createHmac("sha256", salt)
    },

    generateNewHash(secret, salt) {
        var hMac = this.generateHmac(salt);
        hMac.update(secret);
    
        return hMac.digest("hex");
    },

    getGameCrash(hash) {
        hash = this.generateNewHash(hash, this.server_seed);
      
        var hash_chunks = hash.slice(0, 52/4);
      
        var hexa = parseInt(hash_chunks, 16);
        var max_int = Math.pow(2, 52);
      
        var binary = (100 * max_int - hexa);
        
        var crash_result = Math.floor(binary / (max_int - hexa)) / 100.0;
      
        return Math.max(1, crash_result);
      }
};


