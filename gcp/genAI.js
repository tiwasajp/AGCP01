//
// Vertex AI
//


import { SearchServiceClient } from '@google-cloud/discoveryengine';

// Instantiates a client
const client = new SearchServiceClient();

export default class GenAI {
	// Instantiates a client
	client = null;
	projectId = ""; // '817176915976'
	location = "";  // Options: 'global'
	collectionId = ""; // Options: 'default_collection'
	searchEngineId = ""; //'data-1_1693902847424' // Create in Cloud Console
	servingConfigId = ""; // Options: 'default_config'
	
	constructor(model) {
		// Instantiates a client
		this.client = new SearchServiceClient();
		this.projectId = model.projectId;
		this.location = model.location;
		this.collectionId = model.collection;
		this.searchEngineId = model.id;
		this.servingConfigId = model.config;
	}
	
	async generate(queryText) {
		console.log(`GenAI.generate() searchQuery:${queryText}`);

		// The full resource name of the search engine serving configuration.
		// Example: projects/{projectId}/locations/{location}/collections/{collectionId}/dataStores/{searchEngineId}/servingConfigs/{servingConfigId}
		// You must create a search engine in the Cloud Console first.
		const name = this.client.projectLocationCollectionDataStoreServingConfigPath(
			this.projectId,
			this.location,
			this.collectionId,
			this.searchEngineId,
			this.servingConfigId
		);

		const request = {
			pageSize: 1,
			query: queryText,
			servingConfig: name,
		};

		// Perform search request
		const response = await client.search(request);
		var resp_results = []
		for (const results of response) {
			if (results) {
				results.forEach((result) => {
					console.log(result.document.derivedStructData.fields.extractive_answers.listValue.values[0].structValue.fields);
					console.log(result.document.derivedStructData.fields.link.stringValue);
					resp_results.push({
						modelName: this.modelName,
						resultText: result.document.derivedStructData.fields.extractive_answers.listValue.values[0].structValue.fields.content.stringValue,
						attributes: { reference: result.document.derivedStructData.fields.link.stringValue }
					});
				});
			}
		}

		return resp_results;
	}
}


