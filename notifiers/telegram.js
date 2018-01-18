const axios = require('axios');
const querystring = require('querystring');

const endpoint = token => `https://api.telegram.org/bot${token}/sendMessage`;

module.exports = config => text => new Promise((resolve, reject) => {
	const [ chat_id, token ] = config.split('|');

	const url = endpoint(token);

	const qs = querystring.stringify({ chat_id, text });

	return axios.post(url, qs);
});
