var sql = require("./mysql");

module.exports = {
    addLog(user_id, username, admin_level, text) {
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO `chat` (`user_id`, `username`, `admin_level`, `text`) VALUES (?, ?, ?, ?);", [user_id, username, admin_level, text], (err, result) => {
                if(err) return resolve(false);
                if (result.length == 0) return resolve(false);

                resolve(true);
            });
        })
    },

    getLastMessages(lines, chat) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `chat` WHERE chat=? ORDER BY id DESC LIMIT ?", [chat, lines], (err, result) => {
                if(err) return resolve(false);
                if (result.length == 0) return resolve(false);
                
                resolve(result);
            });
        })
    },

    getTotalMessages(user_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `chat` WHERE user_id=? ORDER BY id DESC", [user_id], (err, result) => {
                if(err) return resolve(false);
                if (result.length == 0) return resolve(false);
                
                resolve(result);
            });
        })
    }
};

