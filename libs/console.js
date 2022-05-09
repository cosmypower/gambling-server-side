var colors = require('colors');

module.exports = {
    addLog(text) {
        console.log("[*]".yellow + " " + text)
    },

    addError(text) {
        console.log("[!]".red + " " + text)
    },

    addNew(text) {
        console.log("[+]".green + " " + text)
    },

    addRemove(text) {
        console.log("[-]".red + " " + text)
    }
}