/*
Sample - Web pages & Websocket Server
*/

const
bodyParser = require("body-parser"),  
express = require("express"),
https = require("https"),
http = require("http"),
websocket = require("socket.io"),
fs = require("fs");

//const PORT = 443;
const PORT = 8080;

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.set("port", process.env.PORT || PORT);
app.set("view engine", "ejs");
app.set('trust proxy', true);
module.exports = app;

/*
const io = websocket(https.createServer({
  key  : fs.readFileSync("certificates/private.key"),
  cert : fs.readFileSync("certificates/server.crt"),
  ca   : fs.readFileSync("certificates/ca.crt"),
  requestCert : true,
  rejectUnauthorized : false}, 
  app).listen(PORT, () => {console.log(`Server listening on port ${PORT}`);}),
  {pingTimeout:60000}
);
*/
const io = websocket(http.createServer(app).listen(PORT, () => {console.log(`Server listening on port ${PORT}`);}));

const data = [{text:"zero"}];

app.post("/postText", (req, resp) => {
  resp.sendStatus(200).end();
  data.push({'text':(new Buffer.from(req.body.data, "base64")).toString().replace(/\"/g, '')});
  console.log("/postText", (new Buffer.from(req.body.data, "base64")).toString());
  console.table(data);
});

app.get("/getText", (req, resp) => {
  var text = data[data.length - 1].text;
  resp.send((new Buffer.from(text)).toString("base64")).end();  
  console.log("/getText", "success");
});

io.on("connection", (socket) => {
  socket.on("connect", () => {
	console.log("connect socket.id:", socket.id);
  });
	  
  socket.on("disconnect", () => {
	console.log("disconnect socket.id:", socket.id);
  });

  socket.on("session", (message) => {
	console.log("[session] socket.id:" + socket.id + " " + JSON.stringify(message));
	if (message.action === "join") {
	  socket.join(message.room);
	  io.sockets.emit("session", message);
	  console.log("join userId:", message.userId, "room:", message.room, "length:", io.sockets.adapter.rooms[message.room].length);
	  return;
	}
	else if (message.action === "leave") {
	  console.log("leave userId:", message.userId, "room:", message.room);
	  socket.leave(message.room, () => {
	    io.sockets.emit("session", {action:"leave", userId:message.userId, room:message.room});
	  });
	}
  });

  socket.on("data", (message) => {
	console.table(message.header);
	console.log("message.data:", message.data);
	io.to(message.header.room).json.emit("data", message);
  });
});
