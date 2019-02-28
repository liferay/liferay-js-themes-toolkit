const path = require('path');
const resolve = require('resolve');

const TEMPLATE_LANG_FTL = 'ftl';
const TEMPLATE_LANG_VM = 'vm';

function getBaseThemeGlob(themePath) {
	const templateLanguage = getLiferayThemeJSON(themePath).templateLanguage;
	const glob = '**/!(package.json';

	switch (templateLanguage) {
	case TEMPLATE_LANG_FTL:
		return glob + '|*.' + TEMPLATE_LANG_VM + ')';

	case TEMPLATE_LANG_VM:
		return glob + '|*.' + TEMPLATE_LANG_FTL + ')';

	default:
		return glob + ')';
	}
}

function getLiferayThemeJSON(themePath) {
	const target = path.join(themePath, 'package.json');
	return resolve.sync(target, {basedir: themePath});
}

module.exports = {getBaseThemeGlob, getLiferayThemeJSON};
