/*
 Sample - Web pages & Websocket Server
*/

const fs = require("fs");
const express = require("express");
const websocket = require("socket.io");
//const https = require("https");
const http = require("http");

//const PORT = 443;
const PORT = 80;

const app = express();
app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.set("port", process.env.PORT || PORT);
app.set("view engine", "ejs");
app.set("trust proxy", true);
module.exports = app;

/*
const io = websocket(https.createServer({
  key  : fs.readFileSync("../share/certificates/private.key"),
  cert : fs.readFileSync("../share/certificates/server.crt"),
  ca   : fs.readFileSync("../share/certificates/ca.crt"),
  requestCert : true,
  rejectUnauthorized : false}, 
  app).listen(PORT, () => {console.log(`Server listening on port ${PORT}`);}),
  {pingTimeout:60000}
);
*/

const io = websocket(http.createServer(app).listen(PORT, () => {console.log(`Server listening on port ${PORT}`);}));


// for health check
app.get('/', (req, resp) => {
  console.log(`/ health check ${req.query}`);
  return resp.sendStatus(200);
});

io.on("connection", (socket) => {
  socket.on("connect", () => {
	console.log(`connect socket.id:${socket.id}`);
  });
	  
  socket.on("disconnect", () => {
	console.log(`disconnect socket.id:${socket.id}`);
  });

  socket.on("session", (message) => {
	console.log(`session socket.id:${socket.id} ${JSON.stringify(message)}`);
	if (message.action === "join") {
	  socket.join(message.room);
	  io.sockets.emit("session", message);
	  console.log("join userId:", message.userId, "room:", message.room);
	  return;
	}
	else if (message.action === "leave") {
	  console.log(`leave userId:${message.userId} room:${message.room}`);
	  socket.leave(message.room, () => {
	    io.sockets.emit("session", {action:"leave", userId:message.userId, room:message.room});
	  });
	}
  });

  socket.on("data", (message) => {
	console.table(message.header);
	console.log(`message.body:${JSON.stringify(message.body)}`);
	io.to(message.header.room).emit("data", message);
	
	// bot response ///////////////////////////
	message.header.userId = "bot_1";
	message.header.type = "bot";
	//message.body = {media:{type:"dialog", dialog:{messages:[{type:"text", text:"????"}]}}};	
	io.to(message.header.room).emit("data", message); 
    ///////////////////////////////////////////

  });
});
