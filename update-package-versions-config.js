const version = process.argv[3];

module.exports = {
	files: [
		'packages/generator-liferay-theme/generators/**/*',
		'packages/generator-liferay-theme/lib/!(__tests__)/**/*',
		'packages/liferay-theme-tasks/lib/!(__tests__)/**/*',
	],
	from: [/"liferay-theme-tasks": ".*"/g, /'liferay-theme-tasks': '.*'/g],
	to: [
		`"liferay-theme-tasks": "${version}"`,
		`'liferay-theme-tasks': '${version}'`,
	],
};
