function devDependencies(version) {
	const dependencies = {
		gulp: '3.9.1',
		'liferay-theme-tasks': 'file:../packages/liferay-theme-tasks',
	};

	if (version === '7.0') {
		dependencies['liferay-theme-deps-7.0'] = '8.0.0-rc.3';
	} else if (version === '7.1') {
		dependencies['liferay-theme-deps-7.1'] = '8.0.0-rc.3';
	} else if (version === '7.2') {
		dependencies['liferay-theme-deps-7.2'] = 'file:../packages/liferay-theme-deps-7.2';
		dependencies['css-loader'] = '2.1.0';
		dependencies['mini-css-extract-plugin'] = '0.5.0';
		dependencies['postcss-loader'] = '3.0.0';
		dependencies['sass-loader'] = '7.1.0';
	}

	return dependencies;
}

module.exports = {
	devDependencies,
};
