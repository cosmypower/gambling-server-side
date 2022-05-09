const axios = require('axios');

module.exports = {
    rpc: {
        host: '151.80.119.75',
        port: 7777,
        user: 'edgecrashbtc',
        pw: 'EdgeCrashBitcoinWalletElectrumCosMyJuicY2001z1XBH',
    },

    walletRequest(method, params, cb) {
        var url = `http://${this.rpc.user}:${this.rpc.pw}@${this.rpc.host}:${this.rpc.port}`;

        axios({
            method: 'post',
            url: url,
            data: {
                id: 'curltext',
                method,
                params
            }
        }).then((response) => {
            cb(response);
        }, (error) => {
            cb(false);
        });
    },

    retrieveAddress(cb) {
        module.exports.walletRequest('createnewaddress', {}, (response => {
            cb(response.data.result);
        }));
    },

    getWalletBalance(confirmed_only, cb) {
        module.exports.walletRequest('getbalance', {}, (response => {
            var data = response.data.result;

            cb(parseFloat(data.confirmed) + parseFloat(confirmed_only ? 0 : (data.uncofirmed ? data.uncofirmed : 0)));
        }));
    },

    getFeeRate(fee_level, cb) {
        module.exports.walletRequest('getfeerate', {fee_level}, (response => {
            var data = response.data.result;

            cb(parseFloat(data) / 1000);
        }));
    },

    getHistory(minimum_confirmations, from_block, cb) {
        module.exports.walletRequest('onchain_history', {
            show_addresses: true,
			show_fiat: true,
			from_height: from_block,
        }, (response => {
            var data = response.data;

            var incoming_tarnsactions = data.result.transactions.filter(tx => tx.incoming == true && tx.confirmations > minimum_confirmations && tx.height > 0);

            cb(incoming_tarnsactions.length > 0 ? incoming_tarnsactions[0].height : 0, incoming_tarnsactions);
        }));
    },

    sendBTC(destination, amount, fee, cb) {
        module.exports.walletRequest('payto', { destination, amount, fee}, (response => {
            var data = response.data.result;

            cb(data);
        }));
    },

    sendWithoutFee(destination, amount, cb) {
        module.exports.walletRequest('payto', { destination, amount}, (response => {
            var data = response.data.result;

            cb(data);
        }));
    },

    broadcast(tx, cb) {
        module.exports.walletRequest('broadcast', {tx}, (response => {
            cb(response.data.result);
        }));
    }
}