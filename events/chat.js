module.exports = {
    run(socket, client, crash, data) {
        try {
            const chatFile = require(`./chat/${data.type}`);

            if (chatFile)
                chatFile.run(socket, client, data.content);
        } catch(err) {
            
        }
    }
};