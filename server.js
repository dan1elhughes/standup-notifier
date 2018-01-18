const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const notifier = require('./index');

app.get('/', (req, res) => {
	return res.redirect(301, 'https://github.com/dan1elhughes/standup-notifier');
});

app.post('/', (req, res) => {
	res.sendStatus(200);
	notifier();
});

app.listen(port, () => console.log(`Listening on ${port}`)) // eslint-disable-line
