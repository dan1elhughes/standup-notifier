const axios = require('axios');

module.exports = {
	create: ({ auth, baseURL }) => axios.create({
		baseURL,
		headers: { 'Authorization': `Basic ${auth}` },
	}),
};
