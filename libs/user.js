var sql = require("./mysql");
var bcrypt = require("bcrypt");
var uuid = require("uuid");
var crypto = require('crypto-price');
var cryptojs = require('crypto');
const { resolve } = require("path");

class User {
    constructor(username, password) {
        this.username = username;

        this.password = password;
    }

    createSession(user_id, ua, ip_address, cb) {
        var session_id = uuid.v4();

        const date = new Date();
        const expireDate = new Date(date);

        expireDate.setHours(expireDate.getHours() + 1);

        sql.query("INSERT INTO `sessions` (`time_expire`, `user_id`, `session_id`, `ip`, `user_agent`) VALUES (?, ?, ?, ?, ?);", [expireDate, user_id, session_id, ip_address, ua], (err, result) => {
            if (err) return cb(err, '');

            cb(false, session_id);
        });
    }

    login(user_agent, ip_address) {

        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `users` WHERE username=?", [this.username], (err, result) => {
                if(err) return resolve(false);
                if (result.length == 0) return resolve(false);

                bcrypt.compare(this.password, result[0].password, (err, good_password) => {
                    if (good_password == true) {

                        this.createSession(result[0].id, user_agent, ip_address, (err, sId) => {
                            if (err) return resolve(false);

                            resolve({ data: result[0], session_id: sId });

                            this.user_data = result[0];
                        });
                    } else {
                        resolve(false);
                    }
                });
            });
        })
    }
}

module.exports = {
    class: User,

    getInfo(user_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT id, username, admin_level, btc FROM `users` WHERE id=?", [user_id], (err, result) => {
                if(err) return resolve(false);

                resolve(result[0]);
            })
        });
    },

    updateNetworth(user_id, sum) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT networth FROM `users` WHERE `id`=?", [user_id], async (err, user) => {
                if(err) return resolve(false);

                sql.query("UPDATE `users` SET `networth`=? WHERE `id`=?", [parseFloat(user[0].networth + sum), user_id], async (err, result) => {
                    if(err) return resolve(false);
    
                    return resolve(true);
                });
            });
        });
    },

    updateBalance(sockets, user_id, new_balance) {
        return new Promise((resolve, reject) => {
            sql.query("UPDATE `users` SET `btc`=? WHERE `id`=?;", [new_balance, user_id], async (err, result) => {
                if(err) return resolve(false);

                var data = await module.exports.getInfo(user_id);

                if (data) {
                    if (sockets) {
                        sockets.forEach(socket => {
                            socket.emit("refreshData", {admin_level: data.admin_level, btc: data.btc, username: data.username});
                        });
                    }
                }

                resolve(true);
            });
        });
    },

    getSession(session_id, ip_address, user_agent) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM users WHERE id = (SELECT user_id FROM `sessions` WHERE session_id=? AND ip=? AND user_agent=? AND time_expire > now())", [session_id, ip_address, user_agent], (err, result) => {
                if(err) return resolve(false);
                if (result.length == 0) return resolve(false);

                resolve(result[0]);
            })
        });
    },

    async checkUsername(username) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT COUNT(*) AS users_count FROM users WHERE username=?", [username], (err, result) => {
                if(err) return resolve(true);

                if (result[0].users_count == 0) resolve(true);
                else resolve(false);
            })
        });
    },

    async checkSpam(ip_address) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT COUNT(*) AS users_count FROM users WHERE created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY AND ip_address=?", [ip_address], (err, result) => {
                if(err) return resolve(true);
                
                if (result[0].users_count > 0) resolve(false);
                else resolve(true);
            })
        });
    },

    async register(ip_address, email, pwd, username) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const usernameRegex = /^[a-zA-Z]+$/;

        if (!emailRegex.test(email)) return {succesful: false, error: 'Invalid email address'};
        if (!usernameRegex.test(username)) return {succesful: false, error: 'Invalid username format (only letters)'};

        if (username.length < 3 || username.length > 16) return {succesful: false, error: 'Invalid username length (3-16 letters)'};
        if (pwd.length < 8) return {succesful: false, error: 'Invalid password length (8+ letters)'};

        var already_used = await module.exports.checkUsername(username);
        if (!already_used) return {succesful: false, error: 'There is already an account created with that username'};

        var spam = await module.exports.checkSpam(ip_address);
        if (!spam) return {succesful: false, error: 'You already have an account created in last 24 hours'};

        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO `users` (`username`, `password`, `email`, `ip_address`) VALUES (?, ?, ?, ?)", [username, pwd, email, ip_address], (err, result) => {
                if(err) return resolve({succesful: false, error: 'Error code: #2, send to administrator and try again'});

                resolve({succesful: true});
            })
        });
    },

    logout(session_id) {
        return new Promise((resolve, reject) => {
            sql.query("UPDATE `sessions` SET `time_expire`=NOW() WHERE `session_id`=?", [session_id], (err, result) => {
                if(err) return resolve(false);

                resolve(true);
            })
        });
    },

    async receiveAccountByToken(token) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM `reset_password` WHERE `key`=? AND has_reset=0 AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY", [token], (err, result) => {
                if (err) return resolve(false);
                if (result.length == 0) return resolve(false);
                
                sql.query("SELECT * FROM users WHERE id=?", [result[0].user_id], (err, account) => {
                    if (err) return resolve(false);
                    if (account.length == 0) return resolve(false);

                    resolve({username: account[0].username, email: account[0].email, user_id: account[0].id});
                });
            });
        });
    },

    async userExists(user_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM users WHERE id=?", [user_id], (err, result) => {
                if(err) return resolve(false);
                if (result.length > 0) return resolve(true);

                resolve(false);
            });
        });
    },

    async forgotRequestExists(user_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM reset_password WHERE user_id=? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY", [user_id], (err, result) => {
                if(err) return resolve(true);
                if (result.length == 0) return resolve(false);

                resolve(true);
            });
        });
    },

    async createForgotRequest(username, email) {
        return new Promise(async (resolve, reject) => {
            sql.query("SELECT * FROM users WHERE username=? AND email=?", [username, email], async (err, result) => {
                if(err) return resolve(false);
                if (result.length == 0) return resolve(true);

                var user = result[0];
                var user_exists = await module.exports.userExists(user.id);
                if (!user_exists) return resolve(true);
                
                var request_exists = await module.exports.forgotRequestExists(user.id);
                if (request_exists) return resolve(true);

                var key = cryptojs.randomBytes(20).toString('hex');

                sql.query("INSERT INTO `reset_password` (`user_id`, `key`) VALUES (?, ?)", [user.id, key], (err, result) => {
                    if(err) return resolve(false);
                    
                    resolve({sent: true, token: key});
                });
            })
        });
    },

    async updatePassword(token, password) {
        return new Promise(async (resolve, reject) => {
            var user = await module.exports.receiveAccountByToken(token);

            if (!user) return resolve(false);

            sql.query("UPDATE `users` SET `password`=? WHERE `id`=?", [password, user.user_id], (err, result) => {
                if (err) return resolve(false);

                sql.query("UPDATE `reset_password` SET `has_reset`=1 WHERE `user_id`=?", [user.user_id], (err, result) => {
                    if (err) return resolve(false);

                    resolve(user);
                });
            });
        });
    }
}
