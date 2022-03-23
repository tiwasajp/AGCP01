/*
You need to install Google packages.
VMインスタンスへ、以下のnode.js用のモジュールを、npmでインストールをしてください。
# npm install firebase-admin
# npm install dialogflow
# npm install @google-cloud/language
# npm install @google-cloud/translate
# npm install @google-cloud/vision
# npm install @google-cloud/video-intelligence
# npm install @google-cloud/speech
*/

(async () => {

const ProjectID = "ccai-dialogflow2-uthixs";

//　GCPのNoSQL（Unstructuredのレコードのデータベース）のFirestoreにアクセスする例
/*
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
db.collection('weather').get().then((snapshot) => {
  snapshot.forEach((doc) => {
    if (doc.id === "札幌") {
      console.log(`doc.id ${doc.id}`);
      console.log(doc.data());
    }
  });
}).catch((error) => {
  console.log("Error getting documents", error);
})
*/

//　GCPのファイルサーバーのサービスを利用するAPI
const KmsKeyName = "projects/ccai-dialogflow2-uthixs/locations/asia-east1/keyRings/key-ring1/cryptoKeys/key1";
const Storage = require("./gcp/storage");
var storage = new Storage(KmsKeyName);
//await storage.uploadFivaroCloud("context_bucket1", "path/file").then((filename) => {console.log(filename);});

//　Dialogflowと、フロントエンド側で連携するためのAPI（チャットクライアントのテキストをDialogflowし、レスポンスを受け取るためのAPI）
const DetectIntent = require("./gcp/detectIntent");
var detectIntent = new DetectIntent(ProjectID);
//await detectIntent.detectTextIntent("1", ["今日の名古屋の天気は"], "ja").then((queryResult) => {console.log(queryResult);});

//　テキストの意味分類および単語の感情分離のAPI
const EntitySentiment = require("./gcp/entitySentiment");
var entitySentiment = new EntitySentiment();
//await entitySentiment.getEntitySentiment("アバイアって何？").then((entities) => {console.log(entities);});

//　テキストの品詞分解のAPI
const AnalyzeSyntax = require("./gcp/analyzeSyntax");
var analyzeSyntax = new AnalyzeSyntax();
//await analyzeSyntax.analyzeSyntaxText("今日の東京の天気は").then((syntax) => {console.log(syntax);});

//　多言語翻訳のAPI
const Translate = require("./gcp/translate");
var translate = new Translate(ProjectID);
//await translate.translateText("今日の東京の天気は", "ja", "en").then((translations) => {console.log(translations);});

//　画像解析のAPI
const DetectVision = require("./gcp/detectVision");
var detectVision = new DetectVision();
//await detectVision.detectFaces("/home/AGCP01/public/images/SMBC_Card.png").then((faces) => {console.log(faces);});
//await detectVision.detectLabels("/home/AGCP01/public/images/container-yard.jpg").then((labels) => {console.log(labels);});
//await detectVision.detectLogos("/home/AGCP01/public/images/SMBC.png").then((logos) => {console.log(logos);});
//await detectVision.detectLandmarks("/home/AGCP01/public/images/Place.png").then((landmarks) => {console.log(landmarks);});
//await detectVision.detectFulltext("/home/AGCP01/public/images/SMBC_Card.png").then((fullText) => {console.log(fullText)});

//　ビデオ解析のAPI
const Video = require("./gcp/video");
var video = new Video();
//await video.annotateVideo("gs://bucket/file").then((segmentLabelAnnotations) => {console.log(segmentLabelAnnotations);});
//exec("ffmpeg -i public/tmp/video.mp4 -ac 1 public/tmp/audio.wav", (error, stdout, stderr) => {if (error) {console.log(error);}});

//　音声データのスピーチのテキスト化のAPI
const Speech = require("./gcp/speech");
var speech = new Speech();
//await speech.transcription("path/filename").then((transcription) => {console.log(transcription);});

//　電話の通話の音声データ（μlaw等、8000Hz）のスピーチのテキスト化のAPI
const Speech8k = require("./gcp/speech8k");
var speech8k = new Speech8k();
//await speech8k.transcription_base64(base64_string).then((transcription) => {console.log(transcription);});

})();

