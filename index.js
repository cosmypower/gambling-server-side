const express = require('express')
const app = express()

var debug = true;
const port = debug ? 3000 : 2096;

const fs = require("fs");

var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var crashGame = require("./crash/game.js");

var login = require("./events/user/login.js");
var utils = require("./libs/utils.js");
var console = require("./libs/console.js");
var crash = null;

const client_events = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

function initialiseSocketIO(events) {
  io.on('connection', function(client) {
 
    for (const file of events) {
      const event = require(`./events/${file}`);

      client.on(file.split(".")[0], (...args) => event.run(io, client, crash, ...args));
    }
  })

  console.addLog("Succesfully initialised " + "Socket.IO".red + ".");
}

var logStream = fs.createWriteStream('./logFile.log', {flags: 'a'});

if (!debug)
  process.stdout.write = process.stderr.write = logStream.write.bind(logStream);

server.listen(port, () => {
  setTimeout(() => {
    crash = new crashGame(io);
  }, 2000);

  setTimeout(() => {
    initialiseSocketIO(client_events);
  }, 3000);

  console.addLog("Succesfully initialised " + "HTTP Server".red + ".");
  console.addLog("Succesfully initialised " + "Electrum Wallet".red + " (BTC)".yellow + ".");
})
