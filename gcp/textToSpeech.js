// Imports the Google Cloud client library
import tts from '@google-cloud/text-to-speech';

// Import other required libraries
import fs from 'fs';
import util from 'util';

// Creates a client
const client = new tts.TextToSpeechClient();

async function generateSpeechAudio(text, languageCode, name, ssmlGender, audioEncoding, filePath) {

	// Construct the request
	const request = {
		input: { text: text },
		// Select the language and SSML voice gender (optional)
		voice: { languageCode: languageCode, name: name, ssmlGender: ssmlGender },
		// select the type of audio encoding
		audioConfig: { audioEncoding: audioEncoding },
	};

	// Performs the text-to-speech request
	const [response] = await client.synthesizeSpeech(request);
	// Write the binary audio content to a local file

	const writeFile = util.promisify(fs.writeFile);
	await writeFile(filePath, response.audioContent, 'binary');
	console.log(`Audio content written to file: ${filePath}`);

	return 'ok';
}

const textToSpeech = function() {
	;
}

textToSpeech.prototype.generateSpeechAudio = async function(text, languageCode, name, ssmlGender, audioEncoding, filePath) {
	return await generateSpeechAudio(text, languageCode, name, ssmlGender, audioEncoding, filePath);
}

export default textToSpeech;
