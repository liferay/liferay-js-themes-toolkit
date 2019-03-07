/**
 * "Normalize" an HTML template by adding JS-injection placeholders as
 * HTML comments at the end of the template <body>.
 *
 * @param {string} template
 * @return {string}
 */
function normalize(template) {
	const beforeRegex = /<\/body>/;


	// This should only contain the "script" tag
	// when the "watch" task is running, for normal deploys we don't
	// want it.
	const replacementContent = `
	<!-- inject:js -->
		<script src="http://localhost:9080/webpack-dev-server.js"></script>
	<!-- endinject -->
	`;

	if (template.indexOf(replacementContent) === -1) {
		template = template.replace(beforeRegex, function(match) {
			return replacementContent + match;
		});
	}

	return template;
}

module.exports = normalize;
