/*
You need to install Google packages.
# npm install firebase-admin
# npm install dialogflow
# npm install @google-cloud/language
# npm install @google-cloud/translate
# npm install @google-cloud/vision
# npm install @google-cloud/video-intelligence
# npm install @google-cloud/speech
*/

(async () => {

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
/*
  db.collection('users').get().then((snapshot) => {
	snapshot.forEach((doc) => {
	  if (doc.id === req.query.documentId) {
		console.log(doc.id + "=>" + JSON.stringify(doc.data()));
      }
	});
  }).catch((error) => {
    console.log("Error getting documents", error);
  })
*/

const KmsKeyName = "projects/ccai-dialogflow2-uthixs/locations/asia-east1/keyRings/key-ring1/cryptoKeys/key1";
const Storage = require("./gcp/storage");
let storage = new Storage(KmsKeyName);
// await storage.uploadFileToCloud("context_bucket1", "path/file").then((filename) => {console.log(filename);});

const ProjectID = "ccai-dialogflow2-uthixs";

const DetectIntent = require("./gcp/detectIntent");
let detectIntent = new DetectIntent(ProjectID);
// await detectIntent.detectTextIntent("1", ["text"], "ja").then((queryResult) => {console.log(queryResult);});

const EntitySentiment = require("./gcp/entitySentiment");
let entitySentiment = new EntitySentiment();
// await entitySentiment.getEntitySentiment("text").then((entities) => {console.log(entities);});

const AnalyzeSyntax = require("./gcp/analyzeSyntax");
let analyzeSyntax = new AnalyzeSyntax();
// await analyzeSyntax.analyzeSyntaxText("text").then((syntax) => {console.log(syntax);});

const Translate = require("./gcp/translate");
let translate = new Translate(ProjectID);
// await translate.translateText("text", "ja", "en").then((translations) => {console.log(translations);});

const DetectVision = require("./gcp/detectVision");
let detectVision = new DetectVision();
// await detectVision.detectFaces("path/filename").then((faces) => {console.log(faces);});
// await detectVision.detectLabels("path/filename").then((labels) => {console.log(labels);});
// await detectVision.detectLogos("path/filename").then((logos) => {console.log(logos);});
// await detectVision.detectLandmarks("path/filename").then((landmarks) => {console.log(landmarks);});
// await detectVision.detectFulltext("path/filename").then((fullText) => {console.log(fullText)});

const Video = require("./gcp/video");
let video = new Video();
// await video.annotateVideo("gs://bucket/file").then((segmentLabelAnnotations) => {console.log(segmentLabelAnnotations);});
// exec("ffmpeg -i public/tmp/video.mp4 -ac 1 public/tmp/audio.wav", (error, stdout, stderr) => {if (error) {console.log(error);}});

const Speech = require("./gcp/speech");
let speech = new Speech();
// await speech.transcription("path/filename").then((transcription) => {console.log(transcription);});

const Speech8k = require("./gcp/speech8k");
let speech8k = new Speech8k();
// await speech8k.transcription_base64(base64_string).then((transcription) => {console.log(transcription);});

})();

