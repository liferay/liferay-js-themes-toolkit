'use strict';

const _ = require('lodash');
const path = require('path');
const plugins = require('gulp-load-plugins')();
const log = require('fancy-log');
const postcss = require('gulp-postcss');

const {createBourbonFile} = require('../../lib/bourbon_dependencies');
const divert = require('../../lib/divert');
const lfrThemeConfig = require('../../lib/liferay_theme_config');
const themeUtil = require('../../lib/util');

module.exports = function(options) {
	const {gulp, pathBuild} = options;
	const {storage} = gulp;

	const handleScssError = err => {
		if (options.watching) {
			log(err);

			this.emit('end');
		} else {
			throw err;
		}
	};
	const runSequence = require('run-sequence').use(gulp);

	gulp.task('build:compile-css', function(cb) {
		let changedFile = getSrcPathConfig(storage).changedFile;

		// During watch task, exit task early if changed file is not css

		if (
			changedFile &&
			changedFile.type === 'changed' &&
			!themeUtil.isCssFile(changedFile.path)
		) {
			cb();

			return;
		}

		const themeConfig = lfrThemeConfig.getConfig();

		let compileTask = 'build:compile-lib-sass';

		runSequence(compileTask, cb);
	});

	gulp.task('build:compile-lib-sass', function(cb) {
		const themeConfig = lfrThemeConfig.getConfig();

		let gulpIf = require('gulp-if');
		let gulpSass = require('gulp-sass');
		let gulpSourceMaps = require('gulp-sourcemaps');

		let sassOptions = getSassOptions(options.sassOptions, {
			includePaths: getSassIncludePaths(),
			sourceMap: true,
		});

		const postCSSOptions = getPostCSSOptions(options.postcss);

		let cssBuild = pathBuild + '/_css';

		let srcPath = path.join(cssBuild, '!(_)*.scss');

		gulp.src(srcPath)
			.pipe(plugins.plumber())
			.pipe(gulpIf(sassOptions.sourceMap, gulpSourceMaps.init()))
			.pipe(gulpSass(sassOptions))
			.pipe(
				gulpIf(postCSSOptions.enabled, postcss(postCSSOptions.plugins))
			)
			.on('error', handleScssError)
			.pipe(gulpIf(sassOptions.sourceMap, gulpSourceMaps.write('.')))
			.pipe(gulp.dest(cssBuild))
			.on('end', cb);
	});
};

function concatBourbonIncludePaths(includePaths) {
	return includePaths.concat(createBourbonFile());
}

function getPostCSSOptions(config) {
	let postCSSOptions = {
		enabled: false,
	};

	// We bundle autoprefixer automatically, so do not try to resolve it to the theme

	if (_.isArray(config) && config.length > 0) {
		postCSSOptions.enabled = true;
		postCSSOptions.plugins = config
			.map(pluginName =>
				pluginName === 'autoprefixer'
					? pluginName
					: themeUtil.resolveDependency(pluginName)
			)
			.map(pluginDependency => require(pluginDependency));
	}

	return postCSSOptions;
}

function getSassIncludePaths() {
	let includePaths = [
		themeUtil.resolveDependency(
			divert('dependencies').getDependencyName('mixins')
		),
	];

	includePaths = concatBourbonIncludePaths(includePaths);
	includePaths.push(path.dirname(require.resolve('compass-mixins')));

	return includePaths;
}

function getSassOptions(sassOptions, defaults) {
	if (_.isFunction(sassOptions)) {
		sassOptions = sassOptions(defaults);
	} else {
		sassOptions = _.assign(defaults, sassOptions);
	}

	return sassOptions;
}

function getSrcPathConfig(storage) {
	const themeConfig = lfrThemeConfig.getConfig();

	return {
		changedFile: storage.get('changedFile'),
		deployed: storage.get('deployed'),
		version: themeConfig.version,
	};
}
