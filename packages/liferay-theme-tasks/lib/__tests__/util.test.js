const os = require('os');
const path = require('path');

const testUtil = require('../../test/util');

const cssBuild = 'build/_css';
const themeName = 'explicit-dependency-theme';
const initCwd = process.cwd();

let changedFile;
let util;
let tempPath;
let utilConfig;

beforeEach(() => {
	const config = testUtil.copyTempTheme({
		namespace: 'util',
		themeName: themeName,
	});

	tempPath = config.tempPath;

	util = require('../../lib/util');

	changedFile = {
		path: path.join(tempPath, 'src/css/_custom.scss'),
		type: 'changed',
	};

	utilConfig = {
		changedFile: changedFile,
		deployed: true,
		version: '7.0',
	};
});

afterEach(() => {
	testUtil.cleanTempTheme(themeName, '7.0', 'util', initCwd);
});

it('isCssFile should only return true if css file', () => {
	expect(util.isCssFile('custom.css')).toBe(true);
	expect(!util.isCssFile('main.js')).toBe(true);
});

it('isSassPartial should return true for partial scss file names', () => {
	expect(util.isSassPartial('_partial.scss')).toBe(true);
	expect(!util.isSassPartial('main.scss')).toBe(true);
});

it('resolveDependency should return resolved path of dependency', () => {
	const cssPath = util.resolveDependency(
		'liferay-frontend-common-css'
	);

	expect(cssPath).toBeTruthy();
	expect(cssPath).not.toMatch(/liferay-theme-deps/);
});

it('getCustomDependencyPath should return custom dependency paths set in node env variables', () => {
	const CUSTOM_STYLED_PATH = path.join(
		process.cwd(),
		'node_modules/liferay-frontend-theme-styled'
	);
	const STYLED = 'liferay-frontend-theme-styled';
	const UNSTYLED = 'liferay-frontend-theme-unstyled';

	let customDependencyPath = util.getCustomDependencyPath(UNSTYLED);

	expect(!customDependencyPath).toBe(true);

	process.env['LIFERAY_THEME_STYLED_PATH'] = CUSTOM_STYLED_PATH;

	customDependencyPath = util.getCustomDependencyPath(STYLED);

	expect(customDependencyPath).toEqual(CUSTOM_STYLED_PATH);

	process.env['LIFERAY_THEME_STYLED_PATH'] = 'does/not/exist';

	expect(() => {
		util.getCustomDependencyPath(STYLED);
	}).toThrow();
});

it('hasDependency should return truthy value if dependency is defined in either dependencies or devDependencies', () => {
	let dependency = util.hasDependency({}, 'test-package');

	expect(!dependency).toBe(true);

	dependency = util.hasDependency(
		{
			dependencies: {
				'test-package': '*',
			},
		},
		'test-package'
	);

	expect(dependency).toBeTruthy();

	dependency = util.hasDependency(
		{
			devDependencies: {
				'test-package': '*',
			},
		},
		'test-package'
	);

	expect(dependency).toBeTruthy();
});

it('validateCustomDependencyPath should throw error if customPath does not exist or is not a directory', () => {
	expect(() =>
		util.validateCustomDependencyPath(process.cwd())
	).not.toThrow();

	expect(() =>
		util.validateCustomDependencyPath(
			path.join(process.cwd(), 'package.json')
		)
	).toThrow();

	expect(() => util.validateCustomDependencyPath('does/not/exist')).toThrow();
});
