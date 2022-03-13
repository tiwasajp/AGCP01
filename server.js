/*
 Sample - Web Pages & Websocket Server
*/

const fs = require("fs");
const express = require("express");
const websocket = require("socket.io");
//const https = require("https");
const http = require("http");
const request = require("request");

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
  app).listen(PORT, 
  () => {console.log(`Server listening on port ${PORT}`);}),
    {pingTimeout:60000, pingInterval:25000}
);
*/

const io = websocket(http.createServer(app).listen(PORT, 
  () => {console.log(`Server listening on port ${PORT}`);}, 
    {pingTimeout:60000, pingInterval:25000}
));


// for health check
app.get('/', (req, resp) => {
  console.log(`/ health check ${req.query}`);
  return resp.sendStatus(200);
});

// Chat Client Services /////////////////////////////////////////////////////////////
// チャットのフロントエンドのサービス（顧客のチャットクライアントアプリケーションサーバー）

const getResponseContext = (key, message, _func) => {
	const URL = `https://agcp02-dstgvjoujq-an.a.run.app/getValueByKey?key=${key}`;
	request.get({url:encodeURI(URL), json:true,}, (error, resp, body) => {
		if (!error && resp.statusCode == 200) {
			const data = JSON.parse((new Buffer.from(body, "base64")).toString());
			console.log(`request.get ${data.key} ${data.value}`);
			if (data.value) {
				message.body.media.dialog.messages[0].text = data.value;
			}
			else {
				message.body.media.dialog.messages[0].text = "もう一度、お願いします。";
			}
			_func(message);
		}
		else {
			console.log(`request.get error ${error}`);
			message.body.media.dialog.messages[0].text = "もう一度、お願いします。";
			_func(message);
		}
	});
}

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

  socket.on("data", async (message) => {
	console.table(message.header);
	console.log(`message.body:${JSON.stringify(message.body)}`);
	io.to(message.header.room).emit("data", message);
	　
	if (message.header.type !== "customer") {
		return;
	}
	
	message.header.userId = "bot";
	message.header.type = "bot";
	
	// （１）顧客がタイプしたテキストを、そのままレスポンスする（オウム返し）
	
	io.to(message.header.room).emit("data", message); 
	

	// （２）特定のワードにて、外部データ参照（Cloud RunのWebサービス利用）で、レスポンスを返す
	/*
	// Simple Chat Bot Service //
	if (message.body.media.dialog.messages[0].type === "text") {
		const keywords = ["東京","名古屋","大阪","札幌"];
		var key = "";
		keywords.forEach((keyword) => {
			if(message.body.media.dialog.messages[0].text.indexOf(keyword) !== -1) {
				key = keyword;
			}
		});
		if (key) {
			// Make a bot response using external services ///////
			getResponseContext(key, message, (message) => {
				io.to(message.header.room).emit("data", message); 
			});
    	} 
    	else {
			message.body.media.dialog.messages[0].text = "もう一度、お願いします。";
			io.to(message.header.room).emit("data", message); 
		}
	}
	else {
		;
	}
	*/
	
	// （３）Dialogflowとの連携
	/*
	// Dialogflow Chat Bot Service //
	const ProjectID = "ccai-dialogflow2-uthixs";
	const DetectIntent = require("./gcp/detectIntent");
	var detectIntent = new DetectIntent(ProjectID);
	await detectIntent.detectTextIntent("1", [message.body.media.dialog.messages[0].text], "ja").then((queryResult) => {
		//console.log(queryResult);
		message.body.media.dialog.messages[0].text = queryResult.fulfillmentText;
		io.to(message.header.room).emit("data", message); 
	});
	*/
	
  });
});

// Dialogflow Fulfillment Services /////////////////////////////////////////////////////////////
// Dialogflowのバックエンドのサービス
/*
You need to have installed Google packages.
# npm install dialogflow
# npm install dialogflow-fulfillment
# npm install actions-on-google
*/

var intentMap = new Map();

const agent_contents = (agent) => {
  console.log(`Intent Name:${agent.intent}`);
  console.log(`Agent Session:${agent.session}`);
	
  if (agent.context && agent.context.contexts['avaya-session-telephone']) {
	ani = agent.context.contexts['avaya-session-telephone'].parameters.ani;
	console.log(`Telephpny ani:${ani}`);	
  }

  if (agent.query) {
	console.log(`Agent query:${agent.query}`);
  }
	  
  var replyText = "";
  agent.responseMessages_.forEach(d => {
	if (d.text) {
     replyText += d.text;
	}
  });
  console.log(`Agent replyText:${replyText}`);
};

intentMap.set('Default Welcome Intent', (agent) => {
  agent.add(`こんにちは。要件はなんですか？`);
});

intentMap.set('Default Fallback Intent', (agent) => {
  agent.add(`もう一度、お願いします。`);
});

const getWeather = () => {return {result:"雪"}};

intentMap.set('Weather', (agent) => {
　var weatherInfo = getWeather(agent.contexts);
  agent.add(`${weatherInfo.result}です。`);
});

const {WebhookClient, Payload} = require('dialogflow-fulfillment');
app.post("/webhook", async (req, resp) => {
  var agent = new WebhookClient({request:req, response:resp});
  agent.handleRequest(intentMap);
  agent_contents(agent);
});

