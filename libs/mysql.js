const mysql = require('mysql');
var console = require('./console');

var debug = true;

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: debug ? "" : "password",
    database: "gambling"
});

con.connect(function(err) {
    if (err) throw err;

    console.addLog("Succesfully initialised " + "MySQL".red + ".");
});

module.exports = con