/*
 Sample - Web Pages & Websocket Server
*/

const fs = require("fs");
const express = require("express");
const websocket = require("socket.io");
//const https = require("https");
const http = require("http");
const request = require("request");
const base64 = require('urlsafe-base64');

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

const io = websocket(http.createServer(app).listen(PORT, 
  () => {
	console.log(`Server listening on port ${PORT}`);
  }, 
  {
	  pingTimeout:60000, 
	  pingInterval:25000
  }
));


// health check for instance group/container
app.get('/', (req, resp) => {
  //console.log(`/ health check ${req.query}`);
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
	  console.log(`join userId:${message.userId} room:${message.room}`);
	  return;
	}
	else if (message.action === "leave") {
	  console.log(`leave userId:${message.userId} room:${message.room}`);
	  socket.leave(message.room, () => {
	    io.sockets.emit("session", {action:"leave", userId:message.userId, room:message.room});
	  });
	}
  });

  socket.on("data", async (message) => {
	console.log(`message.header: ${JSON.stringify(message.header)}`);
	console.log(`message.body: ${JSON.stringify(message.body)}`);
	io.to(message.header.room).emit("data", message);
	　
	if (message.header.type !== "customer") {
		return;
	}
	
	message.header.userId = "bot";
	message.header.type = "bot";
	
	// https://ドメイン名/webchat.html　でチャット画面へアクセス

	// （１）顧客がタイプしたテキストを、そのままレスポンスする（オウム返し）
	io.to(message.header.room).emit("data", message); 
	
	// （２）顧客がタイプしたテキストを、英語に翻訳してレスポンスを返す
	// https://cloud.google.com/translate/docs/languages
	/*
	if (message.body.media.dialog.messages[0].type === "text") {
		const Translate = require("./gcp/translate");
		const ProjectID = "自分のProjectIdをここに";
		var translate = new Translate(ProjectID);
		translate.translateText(message.body.media.dialog.messages[0].text, "ja", "en").then((translations) => {
			console.log(translations);
			message.body.media.dialog.messages[0].text = translations[0].translatedText;
			io.to(message.header.room).emit("data", message);
		});
	}
	*/
	
	// （３）画像内のテキストを認識し、テキストをレスポンスにする
	//　画像解析（OCR）のAPI
	/*
	if (message.body.media.dialog.messages[0].type === "image") {
		const DetectVision = require("./gcp/detectVision");
		var detectVision = new DetectVision();
		var imageFile = `public/data/temp.png`;
    	fs.writeFile(imageFile, base64.decode(message.body.media.dialog.messages[0].url.split(',')[1]), async (error) => {
        	if (error) {
          		console.log(`writeFile ${imageFile} ${error}`);
          		return;
        	}
			detectVision.detectFulltext(imageFile).then((fullText) => {
				console.log(fullText)
				message.body.media.dialog.messages[0] = {type:"text", text:fullText[0].text};
				io.to(message.header.room).emit("data", message);
			});
		});
	}
	*/
	
  });
});

