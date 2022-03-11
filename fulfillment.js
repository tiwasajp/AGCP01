/*
Sample - Fulfillment for Dialogflow  
You need to install Google packages.
# npm install dialogflow
# npm install dialogflow-fulfillment
# npm install actions-on-google
*/

const fs = require("fs");
const express = require("express");
const https = require("https");

const PORT = 443;
//const PORT = 80;

const app = express();
app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.set("port", process.env.PORT || PORT);
app.set("view engine", "ejs");
app.set("trust proxy", true);
module.exports = app;

https.createServer({
  key  : fs.readFileSync("../share/certificates/private.key"),
  cert : fs.readFileSync("../share/certificates/server.crt"),
  ca   : fs.readFileSync("../share/certificates/ca.crt"),
  requestCert : true,
  rejectUnauthorized : false}, 
  app).listen(PORT, () => {console.log(`Server listening on port ${PORT}`);});
  
// for health check
app.get('/', (req, resp) => {
  console.log(`/ health check ${req.query}`);
  return resp.sendStatus(200);
});

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