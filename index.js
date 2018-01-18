/* eslint-disable no-console */

const jira = require('./jira');
const assert = require('assert');

const map = fn => arr => arr.map(fn);
const filter = predicate => arr => arr.filter(predicate);
const pipe = fns => init => fns.reduce((p, f) => p.then(f), Promise.resolve(init));

require('dotenv').config();

// Load environment variables
assert(process.env.JIRA_BASE_URL, 'JIRA_BASE_URL environment variable is unset');
assert(process.env.JIRA_USERNAME, 'JIRA_USERNAME environment variable is unset');
assert(process.env.JIRA_PASSWORD, 'JIRA_PASSWORD environment variable is unset');
assert(process.env.JIRA_QUERY, 'JIRA_QUERY environment variable is unset');
const auth = new Buffer(
	process.env.JIRA_USERNAME.trim() + ':' +
	process.env.JIRA_PASSWORD.trim()
).toString('base64');
const baseURL = process.env.JIRA_BASE_URL.trim();
const query = process.env.JIRA_QUERY.trim();

let output = console.log.bind(console);

// Configure output handler, defaults to console
const pushbulletKey = process.env.PUSHBULLET_API_KEY;
if (pushbulletKey) {
	output = require('./notifiers/pushbullet')(pushbulletKey.trim());
}

const telegramKey = process.env.TELEGRAM_CONFIG;
if (telegramKey) {
	output = require('./notifiers/telegram')(telegramKey.trim());
}

const instance = jira.create({ auth, baseURL });

const getRelevantItems = () => instance.get(`/search?jql=${encodeURIComponent(query)}`).then(({ data }) => data.issues);

const extractFields = issue => {
	const { fields, key } = issue;

	const { summary, assignee, status, updated } = fields;

	const { displayName } = assignee;
	const { name } = status;

	return { summary, assignee: displayName, status: name, key, updated };
};

const convertDates = issue => Object.assign(issue, { updated: new Date(issue.updated) });

const lastBusinessDay = new Date();
lastBusinessDay.setDate(lastBusinessDay.getDate() - 1);
const dayOfWeek = lastBusinessDay.getDay();
while (dayOfWeek > 4) {
	lastBusinessDay.setDate(lastBusinessDay.getDate() - 1);
}
const isMostRecentBusinessDay = issue => {

	return (
		issue.updated.getDate() === lastBusinessDay.getDate() &&
		issue.updated.getMonth() === lastBusinessDay.getMonth() &&
		issue.updated.getYear() === lastBusinessDay.getYear()
	);
};

const format = issues => {
	if (!issues.length) {
		return 'No standup issues found.';
	}

	return issues.map(({summary, assignee, status, key }) =>
		`${status}: ${summary} (${key}, ${assignee})`
	).join('\n\n');
}

const app = pipe([
	getRelevantItems,
	map(extractFields),
	map(convertDates),
	filter(isMostRecentBusinessDay),
	format,
	output,
]);

app()
	.then(console.log.bind(console))
	.catch(err => {
		console.log(err);
		process.exit(1);
	});
