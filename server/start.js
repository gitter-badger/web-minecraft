const fs = require('fs');
const opn=require("opn");
const http = require('http');
var server = http.createServer();
var io = require("socket.io")(server);

function exec(cmd) {
	const exec = require('child_process').exec;
 	return new Promise((resolve, reject) => {
  		exec(cmd, (error, stdout, stderr) => {
   			if (error) {
    			console.warn(error);
   			}
   			resolve(stdout? stdout : stderr);
  		});
 	});
}

var config = JSON.parse(fs.readFileSync(__dirname+'/config.json'))

//Express
	var port=config["express-port"]
	const express = require('express');
	const app = express();

	app.use(express.static(__dirname + "/../client/"));
	app.use((req, res, next) => {
	  res.set('Cache-Control', 'no-store')
	  next()
	})
	app.get("/websocket/",function (req,res){
		res.send(String(config["websocket-port"]))
	})
	app.get("/host/",function (req,res){
		res.send(String(config["host"]))
	})
	app.listen(port, () => {
	  // console.log(`Running: \x1b[35m\x1b[4mhttp://${config["host"]}:${port}\x1b[0m`);
	});

//WebSocket
	var world={};
	function saveWorld(){
		fs.writeFile(__dirname+"/savedWorld.json",JSON.stringify(world),function (callback){})
	}
	function restoreWorld(){
		world=JSON.parse(fs.readFileSync(__dirname+'/savedWorld.json'))
	}
	restoreWorld()
	var players={};
	var socketInfo={}

	io.sockets.on("connection", function(socket) {
		// console.log("[\x1b[32m+\x1b[0m] "+socket.id)
		socket.emit("firstLoad",world)

		socket.on("initClient",function (data){
			socketInfo[socket.id]=data
			dolaczGracza(socket.id);
		})
		socket.on("playerUpdate",function (data){
		  	players[socket.id]=data
		  	io.sockets.emit("playerUpdate",players)
		})
		socket.on("blockUpdate",function (block){
		  	world[`${block[0]}:${block[1]}:${block[2]}`]=block[3];
		  	if(block[3]==0){
		    	delete world[`${block[0]}:${block[1]}:${block[2]}`]
		    	// console.log("Block removed",`${block[0]}:${block[1]}:${block[2]}`)
		  	}else{
		    	// console.log("Block placed",`${block[0]}:${block[1]}:${block[2]}`)
		  	}
		  	io.sockets.emit("blockUpdate",block)
		  	saveWorld()
		})
		socket.on("disconnect", function() {
		  	// console.log("[\x1b[31m-\x1b[0m] " + socket.id);
		  	odlaczGracza(socket.id);
		  	delete players[socket.id]
		  	delete socketInfo[socket.id]
		});
	});
	server.listen(config["websocket-port"]);

//Terminal client
	var term = require( 'terminal-kit' ).terminal ;
	term.windowTitle( "web-minecraft console" )
	term.clear()
	term.green((fs.readFileSync(__dirname+'/../src/asciiLogo')))
	info()
	// // Get some user input

	incon()
	function log(message){
		term(`\n${message}\n`)
	}
	function stop(){
		term.brightGreen("\nServer stopped!\n")
			process.exit()
	}
	function help(){
		term.brightGreen(`
help\t- pomoc
stop\t- zatrzymanie serwera
open\t- uruchomienie przeglądarki pod adresem serwera
copen\t- uruchamianie gry w przeglądarce chrome w wersji 'app'
list\t- wypisuje wszystkich aktywnych użytkowników
clear\t- czyści consolę
info\t- wypisuje informacje o serwerze
	`)
	}
	function info(){
		term.gray(`\nSerwer websocket działa pod adresem: http://${config["host"]}:${config["websocket-port"]}\n`)
		term.bold.magenta(`Serwer WWW działa pod adresem: http://${config["host"]}:${config["express-port"]}\n`)
	}

	function com(command){
		if(command=="stop"){
			stop()
		}else if(command=="help" || command=="?"){
			help()
		}else if(command=="clear"){
			term.clear()
		}else if(command=="list"){
			Object.keys(socketInfo).forEach(function (p){
				term(`\n${p} (${socketInfo[p].nick})`)
			})
		}else if(command=="open"){
			opn(`http://${config["host"]}:${config["express-port"]}`)
		}else if(command=="copen"){
			exec(`google-chrome --app=http://${config["host"]}:${config["express-port"]}`)
		}else if(command=="info"){
			info()
		}else if(command!=""){
			term.red("\nNieznana komenda. Użyj 'help' lub '?' aby uzyskać pomoc.")
		}
		incon()
	}
	function incon(){
		term.green( "\nserver> " ) ;
		term.inputField(
			{
				autoComplete: [
					'help' ,
					'stop' ,
					'?',
					'open',
					'clear',
					'info',
					'list',
					'copen'
				] ,
				autoCompleteHint: true ,
				autoCompleteMenu: true ,
			},
		    function( er , input ) {
		        com(input)
		    }
		)
	}
	term.on( 'key' , function( name , matches , data ) {
		if (name==='CTRL_C') { 
			stop() 
		}
	});

//Łączenie z serwerem minecraftowym
	const mineflayer = require('mineflayer')
	function dolaczGracza(socketid){
		socketInfo[socketid].bot = mineflayer.createBot({
		  	host: config.realServer.ip,
		  	port: config.realServer.port,
		  	username: socketInfo[socketid].nick,
		})

		socketInfo[socketid].bot._client.on("map_chunk", function(data) {
	        io.to(socketid).emit("mapChunk",data)
		});

		socketInfo[socketid].bot.on('chat', (username, message) => {
		  	if (username === socketInfo[socketid].bot.username) return
		  	socketInfo[socketid].bot.chat(message)
		})
	}

	function odlaczGracza(socketid){
		socketInfo[socketid].bot.end();
	}

	


