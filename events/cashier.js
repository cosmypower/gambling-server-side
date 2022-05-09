module.exports = {
    run(socket, client, crash, data) {
        try {
            const cashierFile = require(`./cashier/${data.type}`);

            if (cashierFile)
                cashierFile.run(socket, client, crash, data.content);
        } catch(err) {
            
        }
    }
};