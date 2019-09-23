/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: MIT
 */

'use strict';

require('./lib/checkNodeVersion')();

const globby = require('globby');
const _ = require('lodash');
const path = require('path');

const lfrThemeConfig = require('./lib/liferay_theme_config');
const plugins = require('gulp-load-plugins')();

const pluginTasks = require('./plugin');

const themeConfig = lfrThemeConfig.getConfig();

module.exports.registerTasks = function(options) {
	options = require('./lib/options')(options);

	pluginTasks.registerTasks(
		_.defaults(
			{
				extensions: register,
				hookFn: options.hookFn,
				hookModules: themeConfig ? themeConfig.hookModules : null,
				rootDir: options.pathBuild,
				storeConfig: {
					name: 'LiferayTheme',
					path: 'liferay-theme.json',
				},
			},
			options
		)
	);
};

function register(options) {
	const gulp = (options.gulp = plugins.help(options.gulp));
	const store = gulp.storage;

	store.set('changedFile');

	globby.sync([path.resolve(__dirname, 'tasks/**/*')]).forEach(item => {
		if (item.indexOf('__tests__') == -1) {
			require(item)(options);
		}
	});
}
