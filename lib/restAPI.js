/* 
* restAPI.js
* 2017-2022, Tomohiro Iwasa
* This code is licensed under the MIT License
*/

import https from "https";
import http from "http";

export default function(url, options) {
	return new Promise((resolve, reject) => {
		console.log(`restAPI url ${url}`);
		console.log(`restAPI options ${JSON.stringify(options)}`);
		const body = options.body || null;
		if (options.body) {
			delete options.body;
		}
		const timeout = options.timeout || null;
		if (options.timeout) {
			delete options.timeout;
		}
		try {
			const req = (url.startsWith('https:') ? https : http).request(url, options, (resp) => {
				console.log(`restAPI headers: ${JSON.stringify(resp.headers)}`);
				console.log(`restAPI statusCode: ${resp.statusCode}`);
				resp.setEncoding('utf-8');
				let data = "";
				resp.on('data', (chunk) => {
					console.log(`restAPI chunk ${chunk}`);
					data += chunk;
				})
					.on('end', () => {
						console.log(`restAPI data ${data}`);
						if (data) {
							resolve(JSON.parse(data));
						}
						else {
							console.log(`restAPI empty data`);
							resolve(null);
						}
					});
			})
				.on('error', (error) => {
					console.log(`restAPI error ${JSON.stringify(error)}`);
					reject({ error: error });
				})
				.on('timeout', () => {
					req.abort();
					console.log("restAPI Request Timeout");
					reject({ error: "timeout" });
				});
			if (timeout) {
				req.setTimeout(timeout);
			}
			if (body) {
				if (!options.json) {
					//req.write(queryString.stringify(body));
					req.write(body);
				}
				else {
					req.write(JSON.stringify(body));
				}
			}
			req.end();
		}
		catch (error) {
			console.log(`restAPI error ${JSON.stringify(error)}`);
			reject({ error: error });
		}
	});
}
