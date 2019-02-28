const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const resolve = require('resolve');
const util = require('util');
const xml2js = require('xml2js');

const {pathSrc} = require('./options')();

const QUERY_ELEMENTS = {
	'color-scheme': 'id',
	'layout-templates.0.custom.0.layout-template': 'id',
	'layout-templates.0.standard.0.layout-template': 'id',
	'portlet-decorator': 'id',
	'roles': 'single',
	'settings.0.setting': 'key',
};

const STR_LOOK_AND_FEEL = 'look-and-feel';

const THEME_CHILD_ORDER = [
	'$',
	'root-path',
	'templates-path',
	'css-path',
	'images-path',
	'javascript-path',
	'virtual-path',
	'template-extension',
	'settings',
	'control-panel-theme',
	'page-theme',
	'wap-theme',
	'roles',
	'color-scheme',
	'layout-templates',
	'portlet-decorator',
];

function buildXML(lookAndFeelJSON, doctypeElement) {
	let themeQuery = 'look-and-feel.theme.0';

	let themeElement = _.get(lookAndFeelJSON, themeQuery);

	themeElement = _.reduce(
		THEME_CHILD_ORDER,
		function(result, item) {
			if (themeElement[item]) {
				result[item] = themeElement[item];
			}

			return result;
		},
		{}
	);

	_.set(lookAndFeelJSON, themeQuery, themeElement);

	let builder = new xml2js.Builder({
		renderOpts: {
			indent: '\t',
			pretty: true,
		},
		xmldec: {
			encoding: null,
			standalone: null,
		},
	});

	let xml = builder.buildObject(lookAndFeelJSON);

	xml = xml.replace(/(<\?xml.*>)/, '$1\n' + doctypeElement + '\n');

	return xml;
}

function correctJSONIdentifiers(lookAndFeelJSON, name) {
	let themeAttrs = lookAndFeelJSON[STR_LOOK_AND_FEEL].theme[0].$;

	if (name !== themeAttrs.name) {
		themeAttrs.name = name;
		themeAttrs.id = _.kebabCase(name);
	}

	return lookAndFeelJSON;
}

function getLookAndFeelDoctype(themePath) {
	let xmlString = readLookAndFeelXML(themePath);

	let match;

	if (xmlString) {
		match = xmlString.match(/(<!DOCTYPE.*>)/);
	}

	return match ? match[0] : null;
}

function getLookAndFeelDoctypeByVersion(version) {
	version += '.0';

	return util.format(
		'<!DOCTYPE look-and-feel PUBLIC "-//Liferay//DTD Look and Feel %s//EN" "http://www.liferay.com/dtd/liferay-look-and-feel_%s.dtd">',
		version,
		version.replace(/\./g, '_')
	);
}

function getLookAndFeelJSON(themePath, cb) {
	let xmlString = readLookAndFeelXML(themePath);

	if (!xmlString) {
		return cb();
	}

	xml2js.parseString(xmlString, function(err, result) {
		if (err) {
			throw err;
		}

		cb(result);
	});
}

function getNameFromPluginPackageProperties(themePath) {
	let pluginPackageProperties = fs.readFileSync(
		path.join(
			themePath,
			pathSrc,
			'WEB-INF',
			'liferay-plugin-package.properties'
		),
		{
			encoding: 'utf8',
		}
	);

	let match = pluginPackageProperties.match(/name=(.*)/);

	return match ? match[1] : null;
}

function mergeLookAndFeelJSON(themePath, lookAndFeelJSON, cb) {
	getLookAndFeelJSON(themePath, function(json) {
		if (_.isEmpty(lookAndFeelJSON)) {
			lookAndFeelJSON = json;
		} else if (json) {
			lookAndFeelJSON = mergeJSON(lookAndFeelJSON, json);
		}

		let themeInfo = require(resolve.sync(path.join(themePath, 'package.json'), {basedir: themePath}))
			.liferayTheme;

		let baseTheme = themeInfo.baseTheme;

		if (_.isObject(baseTheme)) {
			themePath = path.join(themePath, 'node_modules', baseTheme.name);

			mergeLookAndFeelJSON(themePath, lookAndFeelJSON, cb);
		} else {
			cb(lookAndFeelJSON);
		}
	});
}

function readLookAndFeelXML(themePath) {
	let xmlString = xmlCache[themePath];

	if (xmlString) {
		return xmlString;
	}

	let lookAndFeelDefaultPath = path.join(
		themePath,
		'src/WEB-INF/liferay-look-and-feel.xml'
	);
	let lookAndFeelPath = path.join(
		themePath,
		pathSrc,
		'WEB-INF/liferay-look-and-feel.xml'
	);

	try {
		fs.statSync(lookAndFeelPath);
	} catch (err) {
		lookAndFeelPath = lookAndFeelDefaultPath;
	}

	try {
		xmlString = fs.readFileSync(lookAndFeelPath, 'utf8');

		xmlCache[themePath] = xmlString;
	} catch (err) {}

	return xmlString;
}

module.exports = {
	buildXML,
	correctJSONIdentifiers,
	getLookAndFeelDoctype,
	getLookAndFeelDoctypeByVersion,
	getLookAndFeelJSON,
	getNameFromPluginPackageProperties,
	mergeLookAndFeelJSON,
	readLookAndFeelXML,
};

const xmlCache = {};

function extractThemeElement(obj, key) {
	return obj[STR_LOOK_AND_FEEL].theme[0][key];
}

function mergeJSON(themeObj, baseThemeObj) {
	_.forEach(QUERY_ELEMENTS, function(item, index) {
		let mergedElement;
		let queryString = 'look-and-feel.theme.0.' + index;

		let baseThemeElement = _.get(baseThemeObj, queryString);
		let themeElement = _.get(themeObj, queryString);

		if (item === 'value') {
			mergedElement = mergeThemeElementByValue(
				themeElement,
				baseThemeElement
			);
		} else if (item === 'single') {
			mergedElement = themeElement || baseThemeElement;
		} else {
			mergedElement = mergeThemeElementById(
				themeElement,
				baseThemeElement,
				item
			);
		}

		if (mergedElement) {
			_.set(themeObj, queryString, mergedElement);
		}
	});

	return themeObj;
}

function mergeThemeElementById(themeElements, baseThemeElements, identifier) {
	if (!themeElements || !baseThemeElements) {
		return themeElements ? themeElements : baseThemeElements;
	}

	identifier = identifier || 'id';

	let allElements = themeElements.concat(baseThemeElements);
	let elementIds = [];

	return _.reduce(
		allElements,
		function(result, item) {
			let id = item.$[identifier];

			if (elementIds.indexOf(id) < 0) {
				elementIds.push(id);

				result.push(item);
			}

			return result;
		},
		[]
	);
}

function mergeThemeElementByValue(themeElements, baseThemeElements) {
	if (!themeElements || !baseThemeElements) {
		return themeElements ? themeElements : baseThemeElements;
	}

	return _.uniq(themeElements.concat(baseThemeElements));
}

// Export private methods when in tests
if (typeof jest !== 'undefined') {
	Object.assign(module.exports, {
		extractThemeElement,
		mergeJSON,
		mergeThemeElementById,
		mergeThemeElementByValue,
		xmlCache,
	});
}
