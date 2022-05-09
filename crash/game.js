var funcs = require("./game_funcs");
var console = require("../libs/console.js");
var crash = require("../libs/game.js");
var User = require("../libs/user.js");
var login = require("../events/user/login");

class CrashGame {
    constructor(socket) {
        console.addLog("Succesfully initialised " + "Crash Game".red);

        this.startGame(socket);
    }

    async startGame(socket) {
        this.gameId = (await crash.getLastGameID()) + 1;
        this.gameHash = await crash.getHash(this.gameId);

        this.crashPoint = crash.getGameCrash(this.gameHash);
        this.restartTime = 7000;

        this.elapsedTime = 0;
        this.startTime = new Date();
        this.gameDuration = Math.ceil(funcs.convertCrashToTime(this.crashPoint + 1)); 
        this.gameIsRunning = true;

        this.colors = {
            r: 177,
            g: 177,
            b: 177
        };

        var game_info = {
            bets: this.gameBets,
            colors: this.colors,
            game_id: this.gameId
        };

        socket.emit("game", { type: "start",  content: game_info });

        console.addNew("Crash game started! Total bets: " + 0);

        this.checkForTick(socket);
    }

    gameTick(socket) {
        this.elapsedTime = new Date() - this.startTime;
        var currentPoint = funcs.getCurrentGrowth(this.elapsedTime) / 100;

        this.checkForAutoPayout(socket, currentPoint);

        if (currentPoint > this.crashPoint)
            this.endGame(socket);
        else
            this.checkForTick(socket);
    }

    checkForTick(socket) {
        setTimeout(() => {
            this.gameTick(socket);
        }, 100);
    }

    async getCurrentRoundInfo(socket) {
        var history = await crash.getLastGames(8);

        if (this.gameIsRunning) {
            socket.emit("game", { type: "data",  content: {
                game_running: true,
                elapsed: this.elapsedTime,
                bets: this.gameBets,
                history,
                colors: this.colors,
                game_id: this.gameId
            }});
        } else {
            socket.emit("game", { type: "data",  content: {
                game_running: false,
                history,
                restarting: this.crashTime,
            }});
        }
    }

    async getBetsValue() {
        return new Promise((resolve, reject) => {
            if (!this.gameBets) resolve(0);

            resolve(this.gameBets.reduce( function(a, b){
                return a + b["chips"];
            }, 0))
        });
    }

    async endGame(socket) {
        var bets_value = await this.getBetsValue();
        var bets_length = this.gameBets ? this.gameBets.length : 0;

        socket.emit("game", { type: "end",  content: {
            elapsed: this.elapsedTime,
            crashPoint: this.crashPoint.toFixed(2),
            hash: this.gameHash,
            bets_value: bets_value,
            bets_length: bets_length,
            game_id: this.gameId
        }});

        crash.createGame(this.gameHash, bets_value, bets_length, this.crashPoint.toFixed(2));

        this.gameIsRunning = false;
        this.crashTime = Date.now();

        this.gameBets = [];

        console.addRemove("Crash game busted at " + this.crashPoint.toFixed(2).toString().yellow + "x");

        setTimeout(() => {
            this.startGame(socket);
        }, this.restartTime);
    }

    async cashOut(socket, user) {
        var bet_info = this.gameBets.find(o => o.user.id === user.data.id);
        if (!bet_info) return false;
        if (bet_info.cashed_out) return false;

        if (this.startTime == 0) return false;

        this.elapsedTime = new Date() - this.startTime;
        var currentPoint = funcs.getCurrentGrowth(this.elapsedTime) / 100;
        var profit = (currentPoint * bet_info.chips);

        if (await crash.cashOut(user.sockets, this.gameId, bet_info.user.id, user.data.btc, profit, currentPoint)) {
            bet_info.cashed_out = true;

            socket.emit("game", { type: "cashed_out", content: {user: user.data, initial_bet: bet_info.chips, profit, payout: currentPoint} });

            bet_info.payout = currentPoint;
            bet_info.profit = profit;

            return {
                payout: currentPoint,
                initial_bet: bet_info.chips,
                profit
            }
        }
        
        return false;
    }

    async checkForAutoPayout(socket, current_point) {
        if (!this.gameIsRunning) return false;
        if (!this.gameBets) return false;

        var bets = this.gameBets.filter(o => current_point >= o.auto_payout && o.cashed_out !== true && o.auto_payout > 1);
        if (!bets) return false;

        bets.forEach(async bet => {
            var aUser = login.connected_users[bet.user.id];
            var user = await User.getInfo(bet.user.id);
            if (!user) return;

            if (aUser) {
                this.cashOut(socket, {sockets: aUser.sockets, data: user});
            } else {
                this.cashOut(socket, {data: user});
            }
        });
    }

    async addBet(socket, user, chips, auto_payout) {
        if (this.gameIsRunning) return false;

        if (!user) return false;

        var picked = this.gameBets.find(o => o.user.id === user.data.id);

        if (picked) return false;

        if (user.data.btc == null || user.data.btc == undefined) return false;
        if (chips > user.data.btc || chips <= 0) return false;

        if (await crash.createBet(socket, user.sockets, this.gameId + 1, user.data.id, user.data.username, user.data.btc, chips, auto_payout)) {
            this.gameBets.push({
                user: {id: user.data.id, username: user.data.username},
                game_id: this.gameId + 1,
                chips,
                auto_payout
            });

            return true;
        }

        return false;
    }
}

module.exports = CrashGame;