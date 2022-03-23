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

const {WebhookClient, Payload} = require('dialogflow-fulfillment');
const DetectIntent = require("./gcp/detectIntent");

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
  () => {
    console.log(`Server listening on port ${PORT}`);
  }),
  {
	pingTimeout:60000, 
	pingInterval:25000
  }
);
*/

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

// Chat Client Services /////////////////////////////////////////////////////////////////

// チャットのバックエンド連携サービス（チャットサーバー）からkeyで外部データ検索
const getResponseContext = (key) => {
  // 以下の agcp02-dstgvjoujq-an.a.run.app は、各自のCloud Runで生成されたURLに置き換える。
  //const URL = `https://agcp02-dstgvjoujq-an.a.run.app/getValueByKey?key=${key}`;
  // コンテナーでデプロイした場合は、環境変数で渡すとよい。
  const URL = `${process.env.CONTEXT_SERVER_URL}/getValueByKeyFromFirestore?key=${key}`;
  return new Promise(function (resolve, reject) {
    request.get({url:encodeURI(URL), json:true,}, (error, resp, body) => {
	  if (!error && resp.statusCode == 200) {
	    var data = JSON.parse((new Buffer.from(body, "base64")).toString());
		console.log(`request.get:`);
		console.log(data);
		resolve(data);
	  }
	  else {
	    console.log(`request.get error ${error}`);
		reject(null);
	  }
	});
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
	
	// （１）顧客がタイプしたテキストを、そのままレスポンスする（オウム返し）
	//io.to(message.header.room).emit("data", message); 
	
	// （２）顧客がタイプしたテキストを、英語に翻訳してレスポンスを返す
	//　多言語翻訳のAPI
	/*
	if (message.body.media.dialog.messages[0].type === "text") {
		const Translate = require("./gcp/translate");
		const ProjectID = "ccai-dialogflow2-uthixs";
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
	
	// （４）特定のワードにて、外部データ参照（Cloud RunのWebサービス利用）で、レスポンスを返す
	// Simple Chat Bot Service //
	
	if (message.body.media.dialog.messages[0].type === "text") {
		const keywords = ["東京","名古屋","大阪","札幌"];
		var key = "";
		keywords.forEach((keyword) => {
			if　(message.body.media.dialog.messages[0].text.indexOf(keyword) !== -1) {
				key = keyword;
			}
		});
		if (key) {
			// Make a bot response using external services ///////
			var data = await getResponseContext(key);
			if (data.length > 0) {
			  message.body.media.dialog.messages[0].text = data[0].value;
			}
			else {
			  message.body.media.dialog.messages[0].text = "もう一度、お願いします。";
			}
			io.to(message.header.room).emit("data", message);
    	} 
    	else {
			message.body.media.dialog.messages[0].text = "もう一度、お願いします。";
			io.to(message.header.room).emit("data", message); 
		}
	}
	else {
		;
	}
	
	// （５）Dialogflowとの連携
	// Dialogflow Chat Bot Service //	
	/*
	var detectIntent = new DetectIntent("ccai-dialogflow2-uthixs");
	await detectIntent.detectTextIntent(message.header.userId, [message.body.media.dialog.messages[0].text], "ja").then((result) => {
		console.log(`Dialogflow response:`);
		console.log(result);
		message.body.media.dialog.messages[0].text = result.fulfillmentText;
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

intentMap.set('Default Welcome Intent', (agent) => {
  if (agent.context && agent.context.contexts['avaya-session-telephone']) {
	ani = agent.context.contexts['avaya-session-telephone'].parameters.ani;
	console.log(`Telephpny ani:${ani}`);	
  }
  agent.add(`こんにちは。いつも、お世話になっています。`);
});

intentMap.set('Default Fallback Intent', (agent) => {
  agent.add(`もう一度、お願いします。`);
});

intentMap.set('Weather', async (agent) => {
  console.log(`Agent parameters:`);
  console.log(agent.parameters);
　
  //（１）固定したテキストのレスポンスを、DialogflowへFulfillmentのレスポンスとして返す
  // Make a bot response with dixed text ///////
　agent.add("晴です。");

  //（２）Intentのパラメーターをキーとしてレスポンスを外部データーから取得し、DialogflowへFulfillmentのレスポンスとして返す
  // Make a bot response using external services ///////
  /*
  if (agent.parameters.location.city) {
    var data = await getResponseContext(agent.parameters.location.city);
  	if (data.length > 0) {
      agent.add(`${data[0].value}`);
    }
    else {
      agent.add(`もう一度、お願いします。`);
	}
  }
  else {
    agent.add(`もう一度、お願いします。`);
  }
  */
});

//https://cloud.google.com/dialogflow/es/docs/entities-regexp
intentMap.set('CallMe', async (agent) => {
  console.log(`Agent parameters:`);
  console.log(agent.parameters);
　if (agent.parameters.phone_number[0]) {
    agent.add(`了解です。${agent.parameters.phone_number[0]}へ電話します。`);
  }
  else {
	agent.add(`もう一度、お願いします。`);
  }
});

intentMap.set('Support', async (agent) => {
  console.log(`Agent parameters:`);
  console.log(agent.parameters);
  agent.add(`どんなサポートですか？`);
  agent.context.set({name:'supportitems', lifespan:5, parameters:{}});
});

intentMap.set('Support_wakeup', async (agent) => {
  console.log(`Agent parameters:`);
  console.log(agent.parameters);
  agent.add(`わかりました。起こします。`);
  agent.context.set({name:'supportitems', lifespan:0, parameters:{}});
});

app.post("/webhook", (req, resp) => {
  var agent = new WebhookClient({request:req, response:resp});
  agent.handleRequest(intentMap);
});

