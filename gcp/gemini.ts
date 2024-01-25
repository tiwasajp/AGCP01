//
// Language AI
//

import { restAPI } from "../lib/restAPI.js";
const RESTAPI_TIMEOUT = 30000;

import { _stdout, _stdout_log, _stdout_table } from "../lib/stdout.js";
const INFO: boolean = true;
const DEBUG: boolean = true;

export class Gemini {
	private APIEndpoint: string = ''; // "us-central1-aiplatform.googleapis.com"
	private modelName: string = '';
	private projectId: string = ''; // "avayademojp"
	private location: string = ''; // "us-central1"
	private model_id: string = '';
	private parameters: any = {};
	private access_key: any = { token: "", expires_in: 0, got_at: 0 };

	constructor(config: any) {
		// Instantiates a client
		this.APIEndpoint = config.url;
		this.modelName = config.name;
		this.projectId = config.projectId;
		this.location = config.location;
		this.parameters = config.params;
		this.model_id = config.model;
		this.access_key = { token: "", expires_in: 0, got_at: 0 };
	}

	getToken() {
		return new Promise(async (resolve: any, reject: any) => {
			const access_key_url = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`;
			let elapsed_time = Math.round(((new Date()).getTime() - (new Date(this.access_key.got_at)).getTime()) / 1000);
			if (this.access_key.token && elapsed_time < this.access_key.expires_in) {
				_stdout(INFO, `getToken Valid token found elapsed_time:${elapsed_time}s expires_in:${this.access_key.expires_in}s`);
				resolve(true);
			}
			else {
				try {
					await restAPI(
						access_key_url,
						{
							method: "GET",
							headers: {
								"Metadata-Flavor": "Google",
								"Content-Type": "application/json",
							},
							json: true,
							timeout: RESTAPI_TIMEOUT,
						}
					).then((resp: any) => {
						_stdout_log(DEBUG, resp);
						if (!resp.access_token) {
							_stdout(INFO, `getToken failed get token`);
							reject(true);
						}
						this.access_key.token = resp.access_token;
						this.access_key.expires_in = resp.expires_in;
						this.access_key.got_at = new Date();
						//_stdout(DEBUG, `getToken access_token:${this.token.access_token} got_at:${this.token.got_at}`);
						_stdout(DEBUG, `getToken access_token got_at:${this.access_key.got_at}`);
						_stdout(DEBUG, `getToken access_token access_token:${this.access_key.token}`);
						resolve(this.access_key.token);
					}).catch((error: any) => {
						_stdout(INFO || DEBUG, `getToken catch ${JSON.stringify(error)}`);
						reject(false);
					});
				}
				catch (error: any) {
					_stdout(INFO || DEBUG, `getToken ${JSON.stringify(error)}`);
					reject(false);
				}
			}
		});
	}

	async generate(queryText: string) {
		_stdout(INFO || DEBUG, `Gemini.generate() ${queryText}`);
		//const access_key = execSync('gcloud auth print-access-token').toString().replace(/\n/g, '');
		if (!await this.getToken()) {
			return [{
				modelName: this.modelName, resultText: "",
				attributes: {}
			}];
		}
		var data = {
			"contents": {
				"role": "user",
				"parts": {
					"text": queryText
				},
			},
			"safety_settings": {
				"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
				"threshold": "BLOCK_LOW_AND_ABOVE"
			},
			"generation_config": this.parameters
		}

		/*
		{
			"contents": {
				"role": "user",
					"parts": {
					"text": queryText
				},
			},
			"safety_settings": {
				"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
				"threshold": "BLOCK_LOW_AND_ABOVE"
			},
			"generation_config": {
				"temperature": 0.2,
				"topP": 0.8,
				"topK": 40,
				"maxOutputTokens": 200,
				"stopSequences": [".", "?", "!"]
			}
		}
		*/

		const options = {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${this.access_key.token}`,
				"Content-Type": "application/json",
			},
			timeout: RESTAPI_TIMEOUT,
			json: true,
			body: data,
		};
		const url = `https://${this.APIEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-pro:streamGenerateContent`;
		return await restAPI(url, options).then((resp: any) => {
			_stdout_log(DEBUG, resp);			
			resp.forEach((elem: any, idx: number) => {
				_stdout(DEBUG, `${idx} ${JSON.stringify(elem.candidates[0])}`);
				_stdout(DEBUG, `usageMetadata: ${JSON.stringify(elem.usageMetadata)}`);
			});
						
			return [{
				modelName: this.modelName, resultText: resp[0].candidates[0].content.parts[0].text,
				finishReason: resp[0].candidates[0].finishReason,
				safetyRatings: resp[0].candidates[0].safetyRatings,
				attributes: resp[0].usageMetadata
			}];
		});
	}
}
