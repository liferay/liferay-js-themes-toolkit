'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var Insight = require('insight');
var minimist = require('minimist');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');

var divert = require('liferay-theme-tasks/lib/divert');

module.exports = yeoman.generators.Base.extend({
	initializing: function() {
		var pkg = require('../../package.json');

		this.pkg = pkg;

		this._insight = new Insight({
			trackingCode: 'UA-69122110-1',
			pkg: pkg,
		});
	},

	prompting: function() {
		var instance = this;

		instance.done = instance.async();

		this._setArgv();

		this._setPromptDeprecationMap();

		// Have Yeoman greet the user.
		instance.log(yosay(instance._yosay));

		var insight = this._insight;

		if (_.isUndefined(insight.optOut)) {
			insight.askPermission(null, _.bind(this._prompt, this));
		} else {
			this._prompt();
		}
	},

	configuring: {
		setThemeDirName: function() {
			var themeDirName = this.appname;

			if (!/-theme$/.test(themeDirName)) {
				themeDirName += '-theme';
			}

			this.themeDirName = themeDirName;
		},

		enforceFolderName: function() {
			if (
				this.themeDirName !==
				_.last(this.destinationRoot().split(path.sep))
			) {
				this.destinationRoot(this.themeDirName);
			}

			this.config.save();
		},
	},

	writing: {
		app: function() {
			this.template('_package.json', 'package.json', this);

			this.fs.copy(
				this.templatePath('gitignore'),
				this.destinationPath('.gitignore')
			);

			this.template('gulpfile.js', 'gulpfile.js', this);
		},

		projectfiles: function() {
			this.fs.copy(
				this.templatePath('src/**'),
				this.destinationPath('src'),
				{
					globOptions: {
						ignore: this.templatePath('src/css/custom.css'),
					},
				}
			);

			var customCssName = '_custom.scss';

			this.fs.copy(
				this.templatePath('src/css/custom.css'),
				this.destinationPath('src/css/' + customCssName)
			);

			this.template(
				'src/WEB-INF/liferay-plugin-package.properties',
				'src/WEB-INF/liferay-plugin-package.properties',
				{
					liferayVersion: this.liferayVersion,
					liferayVersions: this.liferayVersion + '.0+',
					themeDisplayName: this.themeName,
				}
			);

			this.template(
				'src/WEB-INF/liferay-look-and-feel.xml',
				'src/WEB-INF/liferay-look-and-feel.xml',
				this
			);
		},
	},

	install: function() {
		var instance = this;

		var skipInstall = this.options['skip-install'];

		if (!skipInstall) {
			this.installDependencies({
				bower: false,
				callback: function() {
					const gulp = require('gulp');
					require('liferay-theme-tasks').registerTasks({gulp: gulp});
					gulp.start('init');
				},
			});
		}
	},

	_getArgs: function() {
		var args = this.args;

		if (!args) {
			args = {};

			this.args = args;
		}

		return args;
	},

	_getPrompts: function() {
		var instance = this;

		var prompts = [
			{
				default: 'My Liferay Theme',
				message: 'What would you like to call your theme?',
				name: 'themeName',
				type: 'input',
				when: instance._getWhenFn('themeName', 'name', _.isString),
			},
			{
				default: function(answers) {
					return _.kebabCase(_.deburr(answers.themeName || ''));
				},
				message: 'Would you like to use this as the themeId?',
				name: 'themeId',
				type: 'input',
				when: instance._getWhenFn('themeId', 'id', _.isString),
			},
			{
				message: 'Which version of Liferay is this theme for?',
				name: 'liferayVersion',
				choices: ['7.2', '7.1', '7.0'],
				type: 'list',
				when: instance._getWhenFn(
					'liferayVersion',
					'liferayVersion',
					instance._isLiferayVersion
				),
			},
			{
				message:
					'What template language would you like this theme to use?',
				name: 'templateLanguage',
				choices: _.bind(instance._getTemplateLanguageChoices, instance),
				type: 'list',
				when: instance._getWhenFn(
					'templateLanguage',
					'template',
					instance._isTemplateLanguage
				),
			},
		];

		return prompts;
	},

	_getTemplateLanguageChoices: answers =>
		divert(
			'app_helpers',
			answers.liferayVersion
		)._getTemplateLanguageChoices(answers),

	_getWhenFn: function(propertyName, flag, validator) {
		var instance = this;

		var args = this._getArgs();
		var argv = this.argv;

		var deprecated = argv.deprecated;
		var promptDeprecationMap = this.promptDeprecationMap;

		return function(answers) {
			var propertyValue = argv[flag];

			var liferayVersion = answers.liferayVersion || argv.liferayVersion;

			if (
				(!answers.liferayVersion || !args.liferayVersion) &&
				argv.liferayVersion
			) {
				answers.liferayVersion = args.liferayVersion = liferayVersion;
			}

			if (
				validator &&
				instance._isDefined(propertyValue) &&
				!validator(propertyValue, answers)
			) {
				propertyValue = null;

				instance.log(
					chalk.yellow('Warning:'),
					'Invalid value set for',
					chalk.cyan('--' + flag)
				);
			}

			var ask = true;
			var propertyDefined = instance._isDefined(propertyValue);

			if (propertyDefined) {
				args[propertyName] = propertyValue;

				ask = false;
			} else if (promptDeprecationMap) {
				var deprecatedVersions = promptDeprecationMap[propertyName];

				ask = !deprecatedVersions;

				if (
					deprecated &&
					deprecatedVersions &&
					deprecatedVersions.indexOf(liferayVersion) > -1
				) {
					ask = true;
				}
			}

			return ask;
		};
	},

	_isDefined: function(value) {
		return !_.isUndefined(value) && !_.isNull(value);
	},

	_isLiferayVersion: function(value) {
		return ['7.2', '7.1', '7.0'].indexOf(value) > -1;
	},

	_isTemplateLanguage: (value, answers) =>
		divert('app_helpers', answers.liferayVersion)._isTemplateLanguage(
			value
		),

	_mixArgs: function(props, args) {
		return _.assign(props, args);
	},

	_printWarnings: function(props) {
		return divert('app_helpers')._printWarnings(this, props);
	},

	_prompt: function() {
		var done = this.done;

		this.prompt(
			this._getPrompts(),
			function(props) {
				props = this._mixArgs(props, this._getArgs());

				this._promptCallback(props);

				this._track();

				done();
			}.bind(this)
		);
	},

	_promptCallback: function(props) {
		var liferayVersion = props.liferayVersion;

		this.appname = props.themeId;
		this.devDependencies = divert(
			'app_helpers',
			liferayVersion
		)._getDevDependencies();
		this.liferayVersion = liferayVersion;
		this.templateLanguage = props.templateLanguage;
		this.themeName = props.themeName;

		divert.defaultVersion = liferayVersion;

		this._setDefaults(liferayVersion);

		this._printWarnings(props);

		this._setPackageVersion();
	},

	_setArgv: function() {
		this.argv = minimist(process.argv.slice(2), {
			alias: {
				id: 'i',
				liferayVersion: 'l',
				name: 'n',
				template: 't',
			},
			string: ['liferayVersion'],
		});
	},

	_setDefaults: function(liferayVersion) {
		_.defaults(this, {
			templateLanguage: 'ftl',
		});
	},

	_setPackageVersion: function() {
		this.packageVersion = '1.0.0';
	},

	_setPromptDeprecationMap: function() {
		this.promptDeprecationMap = {
			templateLanguage: ['7.0'],
		};
	},

	_track: function() {
		var insight = this._insight;

		var liferayVersion = this.liferayVersion;

		insight.track('theme', liferayVersion);
		insight.track(
			'theme',
			liferayVersion,
			'templateLanguage',
			this.templateLanguage
		);
	},

	_yosay:
		'Welcome to the splendid ' + chalk.red('Liferay Theme') + ' generator!',
});
