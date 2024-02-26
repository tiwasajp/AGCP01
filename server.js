//
//  Sample - Web Apps Server
//

import fs from "fs";
//import https from "https";
import http from "http";
import express from "express";
import { Server } from "socket.io";
import base64 from 'urlsafe-base64';

const ProjectId = "avayademojp"; // ご自分のGoogle Cloud ProjectIdに変更してください
const FQDN = "demo.avayaphone.net"; // ご自分のドメイン名に変更してください
const WORKDIR = "/home/node/AGCP11"; // ご自分のパス名に変更してください

import DetectVision from "./gcp/detectVision.js";
import Translate from "./gcp/translate.js";
import TextToSpeech from "./gcp/textToSpeech.js";
import PaLM2 from "./gcp/palm2.js";
import GenAI from "./gcp/genAI.js";
import * as quate from './lib/quote.js';

//const PORT = 443;
const PORT = 80;

const app = express();
app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.set("port", process.env.PORT || PORT);
app.set("view engine", "ejs");
app.set("trust proxy", true);

const io = new Server(http.createServer(app).listen(PORT,
	() => {
		console.log(`Server listening on port ${PORT}`);
	},
	{
		pingTimeout: 60000,
		pingInterval: 25000
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
				io.sockets.emit("session", { action: "leave", userId: message.userId, room: message.room });
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
		
		//io.to(message.header.room).emit("data", message); 
		

		// （２）顧客がタイプしたテキストを、英語に翻訳してレスポンスを返す
		// https://cloud.google.com/translate/docs/languages
		
		if (message.body.media.dialog.messages[0].type === "text") {
			var translate = new Translate(ProjectId);
			translate.translateText(message.body.media.dialog.messages[0].text, "ja", "en").then((translations) => {
				console.log(translations);
				message.body.media.dialog.messages[0].text = translations[0].translatedText;
				io.to(message.header.room).emit("data", message);
			});
		}
		

		// （３）画像内のテキストを認識し、テキストをレスポンスにする
		//　画像解析（OCR）のAPI https://cloud.google.com/vision/docs#docs
		
		if (message.body.media.dialog.messages[0].type === "image") {
			var detectVision = new DetectVision();
			var imageFile = `public/data/temp.png`;
			fs.writeFile(imageFile, base64.decode(message.body.media.dialog.messages[0].url.split(',')[1]), async (error) => {
				if (error) {
					console.log(`writeFile ${imageFile} ${error}`);
					return;
				}
				detectVision.detectFulltext(imageFile).then((fullText) => {
					console.log(fullText)
					message.body.media.dialog.messages[0] = { type: "text", text: fullText[0].text };
					io.to(message.header.room).emit("data", message);
				});
			});
		}
		

		// （４）学習済み生成AIで「回答」を生成して表示（Google PaLM2 利用）
		//　https://japan.googleblog.com/2023/05/palm-2.html
		// https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/api-quickstart
		/*
		if (message.body.media.dialog.messages[0].type === "text") {
			const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
			const palm2 = new PaLM2(config);
			await palm2.generate(message.body.media.dialog.messages[0].text).then((results) => {
				console.log(`PaLM2 回答：${JSON.stringify(results)}`);
				message.body.media.dialog.messages[0].text = results[0].resultText;
				io.to(message.header.room).emit("data", message);
				if (results[0].attributes.categories) {
					console.log(`categories: ${results[0].attributes.categories}`);
					console.log(`scores: ${results[0].attributes.scores}`);
				}
			});
		}
		*/

		// （５）学習済み生成AIで「要約」を生成して表示（Google PaLM2 利用）
		//　 https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text
		/*
		if (message.body.media.dialog.messages[0].type === "text") {
			const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
			const palm2 = new PaLM2(config);
			await palm2.generate(`${message.body.media.dialog.messages[0].text}を5行で要約`).then((results) => {
				console.log(`PaLM2 要約：${JSON.stringify(results)}`);
				message.body.media.dialog.messages[0].text = results[0].resultText;
				io.to(message.header.room).emit("data", message);
				if (results[0].attributes.categories) {
					console.log(`categories: ${results[0].attributes.categories}`);
					console.log(`scores: ${results[0].attributes.scores}`);
				}
			});
		}
		*/

		// （６）	自分のデーターで学習させた、自分の生成AIモデルで「回答」を生成して表示（Google Vertex AI 利用）
		// Vertex AI Search and Conversationを利用
		// https://cloud.google.com/vertex-ai-search-and-conversation
		//　https://console.cloud.google.com/gen-app-builder
		/*
		if (message.body.media.dialog.messages[0].type === "text") {
			const model = {projectId: "817176915976", location: "global", collection: "default_collection", id: "hida-recommends-1_1703202913808", config: "default_config"};
			const genAI = new GenAI(model);
			await genAI.generate(message.body.media.dialog.messages[0].text).then((results) => {
				console.log(`GenAI 回答：${JSON.stringify(results)}`);
				console.log(`reference: ${results[0].attributes.reference}`);
				message.body.media.dialog.messages[0].text = `${results[0].resultText} (${results[0].attributes.reference})`;
				io.to(message.header.room).emit("data", message);
			});
		}
		*/

		// （７）	自分のデーターで学習させた、自分の生成AIモデルで「回答」を生成し、「要約」して表示（Google Vertex AI、PaLM2 利用）
		//　長文の回答を、同じPaLM2のモデルを利用して「要約」を行います。この例では5行の要約を指示しています。
		//  https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text
		/*
		if (message.body.media.dialog.messages[0].type === "text") {
			const model = { projectId: "817176915976", location: "global", collection: "default_collection", id: "hida-recommends-1_1703202913808", config: "default_config" };
			const genAI = new GenAI(model);
			await genAI.generate(message.body.media.dialog.messages[0].text).then(async (results) => {
				console.log(`GenAI 回答：${JSON.stringify(results)}`);
				const reference = results[0].attributes.reference;
				const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
				const palm2 = new PaLM2(config);
				await palm2.generate(`${results[0].resultText}を5行で要約`).then((results) => {
					console.log(`PaLM2 要約：${JSON.stringify(results)}`);
					message.body.media.dialog.messages[0].text = `${results[0].resultText} (${reference})`;
					io.to(message.header.room).emit("data", message);
				});
			});
		}
		*/

		// （８）	入力テキストの分析により、自分の生成AIモデルまたは学習済みモデルを選択し、回答を要約して表示（Google Vertex AI、PaLM2 利用）
		// この例では、正規表現でシンプルに、「飛騨」が含まれればVertex AIで生成した飛騨の名産品のモデルを利用、それ以外は学習済みPaLM2を利用して回答を表示
		// 実用では、LangChainや、Dialogflowを活用して、意味解釈で最適な生成AIのモデルを選択する処理を考慮する必要がある。
		//　https://cloud.google.com/blog/products/ai-machine-learning/generative-ai-applications-with-vertex-ai-palm-2-models-and-langchain
		/*
		if (message.body.media.dialog.messages[0].type === "text") {
			var regexp = /飛騨/ig; // 正規表現
			// g（global）2番目、3番目... にマッチする部分も検索する
			// i（ignore case）大文字・小文字を区別しない
			if (regexp.test(message.body.media.dialog.messages[0].text)) {
				const model = { projectId: "817176915976", location: "global", collection: "default_collection", id: "hida-recommends-1_1703202913808", config: "default_config" };
				const genAI = new GenAI(model);
				await genAI.generate(message.body.media.dialog.messages[0].text).then(async (results) => {
					console.log(`GenAI 回答：${JSON.stringify(results)}`);
					const reference = results[0].attributes.reference;
					const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
					const palm2 = new PaLM2(config);
					await palm2.generate(`${results[0].resultText}を5行で要約`).then((results) => {
						console.log(`PaLM2 要約：${JSON.stringify(results)}`);
						message.body.media.dialog.messages[0].text = `${results[0].resultText} (${reference})`;
						io.to(message.header.room).emit("data", message);
					});
				});
			}
			else {
				const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
				const palm2 = new PaLM2(config);
				await palm2.generate(message.body.media.dialog.messages[0].text).then(async(results) => {
					console.log(`PaLM2 回答：${JSON.stringify(results)}`);
					await palm2.generate(`${results[0].resultText}を5行で要約`).then((results) => {
						console.log(`PaLM2 要約：${JSON.stringify(results)}`);
						message.body.media.dialog.messages[0].text = results[0].resultText;
						io.to(message.header.room).emit("data", message);
					});
				});
			}
		}
		*/

	});
});

const textToSpeech = new TextToSpeech(ProjectId);
const generateAudioFile = (languageCode, name, text, folder, file) => {
	return new Promise(async (resolve) => {
		var result = { text: text, folder: folder, file: file };
		await textToSpeech.generateSpeechAudio(result.text, languageCode, name, "NEUTRAL", "MULAW", `${folder}/${file}`).then((error) => {
			// translatedText, languageCode, name, ssmlGender, audioEncoding, filePath
			console.log(`textToSpeech ${error} ${JSON.stringify(result)}`);
			resolve(result);
		});
	});
}

app.post("/webhook", async (req, resp) => {
	console.log();
	console.log(req.body);
	console.log(`intentInfo: ${JSON.stringify(req.body.intentInfo)}`);
	let projectId = req.body.sessionInfo.session.split('/')[1];
	let sessionId = req.body.sessionInfo.session.split('/')[9];
	console.log(`project: ${projectId}`);
	console.log(`session: ${sessionId}`);
	console.log(`confidence: ${req.body.confidence}`);
	console.log(`pageInfo: ${req.body.pageInfo.displayName}`);
	console.log(`tag: ${req.body.fulfillmentInfo.tag}`);
	let parameters = JSON.stringify(req.body.sessionInfo.parameters);
	console.log(`parameters: ${parameters}`);
	console.log(`messages: ${JSON.stringify(req.body.messages)}`);
	console.log(`payload: ${JSON.stringify(req.body.payload)}`);
	console.log(`transcript: ${req.body.transcript}`);
	console.log(`languageCode: ${req.body.languageCode}`);
	try {
		let text = "";
		let transfer = false;
		switch (req.body.fulfillmentInfo.tag) {
			case 'Start':
				console.log(`Start: phoneNumber ${req.body.sessionInfo.parameters['avaya-session-telephone'].ani}`);
				text = `<speak><audio src="https://${FQDN}/audios/chime.wav"></audio></speak>`;
				break;
			case 'StockPrice':
				console.log(`StockPrice: CompanyName ${req.body.sessionInfo.parameters.company_name}`);
				let ticker = 'AAPL';
  				const quateGet = quate.get(ticker);
				await quateGet.then((result) => {
    				console.log(`result:${req.body.sessionInfo.parameters.company_name} ${result.postMarketPrice}`);
					text = `<speak>${req.body.sessionInfo.parameters.company_name}の株価は${result.postMarketPrice}ドルです。</speak>`
				});;
				break;
			case 'Translation':
				var translatedText_en = "";
				var translate = new Translate(ProjectId);
				await translate.translateText(req.body.transcript, "ja", "en").then((translations) => {
					translatedText_en = translations[0].translatedText;
					console.log(`翻訳 ${req.body.transcript} -> ${translatedText_en}`);
				});
				var result = await generateAudioFile('en-US', 'en-US-Wavenet-D', translatedText_en, `${WORKDIR}/public/data`, `tts_en.wav`);
				text = `<speak><audio src="https://${FQDN}/data/${result.file}"></audio></speak>`;
				break;
			case 'PaLM2':
				console.log(`PaLM2 ${req.body.transcript}`);
				const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
				const palm2 = new PaLM2(config);
				await palm2.generate(`${req.body.transcript}を5行で要約`).then((results) => {
						console.log(`PaLM2 要約：${JSON.stringify(results)}`);
						text = `<speak>${results[0].resultText}</speak>`;
				});
				break;
			case 'VertexAI':
				console.log(`VertexAI ${req.body.transcript}`);
				const model = { projectId: "817176915976", location: "global", collection: "default_collection", id: "hida-recommends-1_1703202913808", config: "default_config" };
				const genAI = new GenAI(model);
				await genAI.generate(req.body.transcript).then(async (results) => {
					console.log(`GenAI 回答：${JSON.stringify(results)}`);
					const config = { projectId: ProjectId, model: "text-bison@001", params: { candidateCount: 1, maxOutputTokens: 512, temperature: 0.2, topP: 0.8, topK: 40 } };
					const palm2 = new PaLM2(config);
					await palm2.generate(`${results[0].resultText}を5行で要約`).then((results) => {
						console.log(`PaLM2 要約：${JSON.stringify(results)}`);
						text = `<speak>${results[0].resultText}</speak>`;
					});
				});
				break;
			case 'EndSession':
				// フロー終了時の処理を記述
				console.log(` フロー終了切断`);
				break;
			case 'Hangup':
				// お客様切断時の処理を記述
				console.log(`お客様切断`);
				break;
			default:
				text = `<speak><audio src="https://${FQDN}/audios/boing_x.wav"></audio></speak>`;
				break;
		}
		let messages = [];
		if (text) {
			messages.push({ "text": { "text": [text], }, });
		}
		if (transfer) {
			messages.push({
				"payload": {
					"avaya_telephony": {
						"transfer": {
							"type": "blind",
							"transferaudio": "https://${FQDN}/audios/sample1.wav",
							"maxtime": "600s",
							"dest": `tel:${getTransferToNumber()}`,
							"connecttimeout": "60s",
							"uui": "00FA08000E04E35CA37458;encoding=hex"
						},
						"return": {
							"state": "ok"
						}
					},
				},
			});
		}
		resp.send({
			fulfillment_response: {
				messages: messages,
			},
		}).end();
		console.log(`resp.send ${JSON.stringify(messages)}`);
	}
	catch (error) {
		console.log(`error ${JSON.stringify(error)}`);
	}
});


