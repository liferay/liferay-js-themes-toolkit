/**
 * Base set of dependencies that are common to all Liferay themes.
 */
const BASE_DEPENDENCIES = Object.freeze({
	'compass-mixins': '0.12.10',
	'gulp-sass': '3.2.0',
	'liferay-frontend-common-css': '1.0.4',
	'liferay-frontend-theme-classic-web': '2.0.2',
	'liferay-frontend-theme-styled': '3.0.13',
	'liferay-frontend-theme-unstyled': '3.0.13',
	'liferay-theme-deps-normalize': '^8.0.0-rc.3',
});

/**
 * Dependencies for each version of Liferay. Currently, uniform across versions
 * 7.0 through 7.2.
 */
const DEPENDENCIES = {
	'BASE': BASE_DEPENDENCIES,
	'7.0': BASE_DEPENDENCIES,
	'7.1': BASE_DEPENDENCIES,
	'7.2': BASE_DEPENDENCIES,
};

module.exports = Object.assign({}, DEPENDENCIES, {
	/**
	 * Utility function for creating a string suitable for injection into a
	 * package.json "dependencies" section.
	 *
	 * TODO: don't do this; generate JSON from an object instead, using
	 * `JSON.stringify`.
	 */
	stringify: function(version = 'BASE') {
		let output = [];
		const deps = DEPENDENCIES[version];
		Object.keys(deps).forEach(pkg => {
			output.push(`\t"${pkg}": "${deps[pkg]}"`);
		});
		return output.join(',\n');
	},
});
