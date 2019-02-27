const dependencies = require('liferay-theme-tasks/lib/dependencies');

function _getDevDependencies() {
	return dependencies.stringify('7.2');
}

module.exports = {
	_getDevDependencies,
};
