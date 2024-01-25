//
// PaLM2
//

import restAPI from "./../lib/restAPI.js";
const RESTAPI_TIMEOUT = 30000;


export default class PaLM2 {
	APIEndpoint = "us-central1-aiplatform.googleapis.com"
	projectId = "";
	location = "us-central1";
	modelId = "";
	parameters = {};
	access_key = {};

	constructor(config) {
		// Instantiates a client
		this.projectId = config.projectId;
		this.location = config.location;
		this.parameters = config.params;
		this.model = config.model;
		this.access_key = { token: "", expires_in: 0, got_at: 0 };
	}

	getToken() {
		return new Promise(async (resolve, reject) => {
			const access_key_url = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`;
			let elapsed_time = Math.round(((new Date()).getTime() - (new Date(this.access_key.got_at)).getTime()) / 1000);
			if (this.access_key.token && elapsed_time < this.access_key.expires_in) {
				console.log(`getToken Valid token found elapsed_time:${elapsed_time}s expires_in:${this.access_key.expires_in}s`);
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
					).then((resp) => {
						console.log(resp);
						if (!resp.access_token) {
							console.log(`getToken failed get token`);
							reject(true);
						}
						this.access_key.token = resp.access_token;
						this.access_key.expires_in = resp.expires_in;
						this.access_key.got_at = new Date();
						//console.log(`getToken access_token:${this.token.access_token} got_at:${this.token.got_at}`);
						console.log(`getToken access_token got_at:${this.access_key.got_at}`);
						console.log(`getToken access_token access_token:${this.access_key.token}`);
						resolve(this.access_key.token);
					}).catch((error) => {
						console.log(`getToken catch ${JSON.stringify(error)}`);
						reject(false);
					});
				}
				catch (error) {
					console.log(`getToken ${JSON.stringify(error)}`);
					reject(false);
				}
			}
		});
	}

	async generate(queryText) {
		console.log(`PaLM2.generate() ${queryText}`);
		//const access_key = execSync('gcloud auth print-access-token').toString().replace(/\n/g, '');
		if (!await this.getToken()) {
			return [{
				resultText: "",
				attributes: {}
			}];
		}
		var data = {
			"instances": [
				{
					"content": queryText
				}
			],
			"parameters": this.parameters
		}
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
		const url = `https://${this.APIEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:predict`;
		return await restAPI(url, options).then((resp) => {
			console.log(`content: ${resp.predictions[0].content.replace(/\n/g, '')}`);
			console.log(`safetyAttributes: ${JSON.stringify(resp.predictions[0].safetyAttributes)}`);
			console.log(`citationMetadata: ${JSON.stringify(resp.predictions[0].citationMetadata)}`);
			console.log(`outputTokenCount: ${JSON.stringify(resp.metadata.tokenMetadata.outputTokenCount)}`);
			console.log(`inputTokenCount: ${JSON.stringify(resp.metadata.tokenMetadata.inputTokenCount)}`);
			resp.predictions[0].safetyAttributes.categories.forEach((elem, idx) => {
				console.log(`${elem}(${resp.predictions[0].safetyAttributes.scores[idx]})`);
			});
			return [{
				resultText: resp.predictions[0].content.replace(/\n/g, ''),
				attributes: { categories: resp.predictions[0].safetyAttributes.categories, 
								scores: resp.predictions[0].safetyAttributes.scores }
			}];
		});
	}
}
