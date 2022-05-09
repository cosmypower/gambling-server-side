module.exports = {
    run(socket, client, crash, data) {
        try {
            const gameFile = require(`./game/${data.type}`);

            if (gameFile)
                gameFile.run(socket, client, crash, data.content);
        } catch(err) {
        
        }
    }
};