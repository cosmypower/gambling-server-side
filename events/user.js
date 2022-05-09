module.exports = {
    run(socket, client, crash, data) {
        try {
            const userFile = require(`./user/${data.type}`);

            if (userFile)
            userFile.run(socket, client, data.content);
        } catch(err) {
            
        }
    }
};