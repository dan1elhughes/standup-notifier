const app = require('./index');

app()
	.then(console.log.bind(console))
	.catch(err => {
		console.log(err);
		process.exit(1);
	});
