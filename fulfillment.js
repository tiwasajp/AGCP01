/*
Sample - Fulfillment for Dialogflow  
You need to install Google packages.
# npm install dialogflow-fulfillment
# npm install actions-on-google
*/

const
bodyParser = require("body-parser"),  
express = require("express"),
https = require("https"),
http = require("http"),
fs = require("fs");

const PORT = 443;
//const PORT = 80;

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.set("port", process.env.PORT || PORT);
app.set("view engine", "ejs");
app.set('trust proxy', true);
module.exports = app;

https.createServer({
  key  : fs.readFileSync("certificates/private.key"),
  cert : fs.readFileSync("certificates/server.crt"),
  ca   : fs.readFileSync("certificates/ca.crt"),
  requestCert : true,
  rejectUnauthorized : false}, app)
  .listen(PORT, () => {console.log(`Server listening on port ${PORT}`);
});

//http.createServer(app).listen(PORT, () => {console.log(`Server listening on port ${PORT}`);});

let intentMap = new Map();

const agentInfo = (agent) => {
  console.log("Intent Name:" +  agent.intent);
  console.log(agent.session);
	
  if (agent.context && agent.context.contexts['avaya-session-telephone']) {
	ani = agent.context.contexts['avaya-session-telephone'].parameters.ani;
	console.log("ani:", ani);	
  }

  if (agent.query) {
	console.log("agent.query:", agent.query);
  }
	  
  var replyText = "";
  agent.responseMessages_.forEach(d => {
	if (d.text) {
     replyText += d.text;
	}
  });
  console.log("replyText:" +  replyText);
};

intentMap.set('Default Welcome Intent', (agent) => {
  agent.add(`こんにちは。要件はなんですか？`);
});

intentMap.set('Default Fallback Intent', (agent) => {
  var contexts = JSON.stringify(agent.contexts);
  if (contexts.indexOf("avaya-session-telephone") !== -1 && contexts.indexOf("getcustomerid") !== -1 && customerId != "") {
	  agent.add(`<speak>入力された会員番号は<say-as interpret-as=\"characters\">${customerId}</say-as>です。</speak>`);
	  var customer = customers.getCustomerByCustomerId(customerId);
	  if (customer) {
		//customer.items.splice(customer.items.length - 1);
		//customer.items.push(item);
	    console.log(customer.nameKatakana, customer.addressYomigana);
	    agent.add(`<speak>登録がありました。こんにちは。${customer.nameKatakana}さん。</speak>`);
		agent.add(`<speak>注文してください。</speak>`);
		agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/chime_down.wav"></audio></speak>`);
		agent.context.set({name:'getcustomerid', lifespan:-1, parameters:{}});
		agent.context.set({name:'getitemcode', lifespan:5, parameters:{}});
	  }
	  else {
		 console.log("no customer record");
		 agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/boing_x.wav"></audio></speak>`);
		 agent.add(`<speak>残念ながらその会員番号の登録がありません。もう一度、会員番号をしっかりと言うか、入力してください。</speak>`);
	     agent.context.set({name:'getcustomerid', lifespan:5, parameters:{}});
	  }
  }
  else if (contexts.indexOf("getitemcode") !== -1) {
	agent.add(`<speak>ちゃんと商品リストを見て答えてくださいね。</speak>`);
  }
  else {
    agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/boing_x.wav"></audio></speak>`);
    agent.add(`<speak>もう一度、お願い。ちゃんと言ってね。</speak>`);
  }
});

intentMap.set('Weather', (agent) => {
  agent.add(`<speak>晴れる。</speak>`);
});

intentMap.set('Welcome', (agent) => {
  agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/chime.wav"></audio></speak>`);
  agent.add(`<speak>こちらは東京都港区赤坂の阿梅屋商店です。</speak>`);
  if (agent.context.contexts['avaya-session-telephone']) {
    let ani = agent.context.contexts['avaya-session-telephone'].parameters.ani;
    //agent.add(`<speak>あなたの電話番号は<say-as interpret-as=\"digits\">${ani}</say-as>ですね。</speak>`);
  }
  agent.add(`<speak>さっそく質問です。会員番号はなんですか。</speak>`);
  agent.context.set({name:'getcustomerid', lifespan:5, parameters:{}});
});

intentMap.set('Transfer', (agent) => {
  agent.add(`<speak>担当者にお繋ぎしますので、ここままお待ちください。</speak>`);
  let HUNT_ID = "10001";
  let transferTo = "tel:" + HUNT_ID;
  agent.add(new Payload(agent.UNSPECIFIED, 
    {
      "avaya_telephony": {
	      "transfer": {
	      "type": "consultation",
          "transferaudio": "https://aura.uxportal.jp/audios/sample1.wav",
	      "maxtime": "600s",
	      "dest": transferTo,
	      "connecttimeout": "60s"
	    }
      }
    }, 
    {
      rawPayload: true, 
      sendAsMessage: false
    }
  ));
});

intentMap.set('GetCustomerId', (agent) => {
  var customerId = agent.contexts[0].parameters.CustomerId;
  agent.add(`<speak>おっしゃっていただいた会員番号は<say-as interpret-as=\"characters\">${customerId}</say-as>です。</speak>`);
  var customer = null; // このあたりに、会員番号をキーにしてデータベースを検索するメソッドを追加する
  if (customer) {
	//customer.items.splice(customer.items.length - 1);
	//customer.items.push(item);
    console.log(customer.nameKatakana, customer.addressYomigana);
    agent.add(`<speak>登録がありました。こんにちは。${customer.nameKatakana}さん。</speak>`);
	agent.add(`<speak>注文してください。</speak>`);
	agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/chime_down.wav"></audio></speak>`);
	agent.context.set({name:'getcustomerid', lifespan:-1, parameters:{}});
    agent.context.set({name:'getitemcode', lifespan:5, parameters:{}});
  }
  else {
	console.log("no customer record");
	agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/boing_x.wav"></audio></speak>`);
	agent.add(`<speak>残念ながらその会員番号の登録がありません。もう一度、本当の会員番号をしっかりと言うか、入力してください。</speak>`);
    agent.context.set({name:'getcustomerid', lifespan:5, parameters:{}});
  }
});

intentMap.set('SelectItems - yes', (agent) => {
  agent.add(`<speak>続けて、注文してください。完了する場合は、完了といってくださいね。</speak>`);
  agent.add(`<speak><audio src="https://aura.uxportal.jp/audios/chime_down.wav"></audio></speak>`);
  agent.context.set({name:'getitemcode', lifespan:5, parameters:{}});
});

intentMap.set('SelectItems', (agent) => {
  var item = agent.contexts[0].parameters.any;
  var quantity = agent.contexts[0].parameters['number-integer'];
  agent.add(`<speak>注文は${item}を${quantity}ですね。</speak>`);
  agent.context.set({name:'selectitems - yes', lifespan:2, parameters:{}});
  agent.context.set({name:'selectitems - no', lifespan:2, parameters:{}});
});

intentMap.set('GetItemCode', (agent) => {
  var itemCode = agent.contexts[0].parameters.ItemCode;
  var quantity = agent.contexts[0].parameters['number-integer'];
  console.log("itemCode:" + itemCode + " quantity:" + quantity);
  var item = items.getItemByItemCode(itemCode);
  if (item) {
	console.log(item);
    agent.add(`<speak>注文は${item.itemName}を<say-as interpret-as=\"number\">${quantity}</say-as>${item.countingType}ですね。</speak>`);
    agent.context.set({name:'selectitems - yes', lifespan:2, parameters:{}});
    agent.context.set({name:'selectitems - no', lifespan:2, parameters:{}});
	//agent.context.set({name:'selectitems', lifespan:3, parameters:{}});
  }
  else {
	console.log("no item record");
	agent.add(`<speak>そんなの無いよ。ちゃんと商品リストを見て答えてくださいね。</speak>`);
	agent.context.set({name:'selectitems', lifespan:3, parameters:{}});
  }
});

intentMap.set('Hangup', (agent) => {
  agent.add(``);
});

app.post("/webhook", async (req, resp) => {  
  // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
  // https://dialogflow.com/docs/reference/fulfillment-library/webhook-client#webhookclientaddresponse_response
  //let response = new ResponseMock(callback);
  const {WebhookClient, Payload} = require('dialogflow-fulfillment');
  const agent = new WebhookClient({request:req, response:resp});
  agent.handleRequest(intentMap);
});