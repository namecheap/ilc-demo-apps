const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
// every app gets a project with tests/<app> as a root, so a new app without tests fails the run
const apps = fs
    .readdirSync(path.join(repoRoot, 'apps'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

// Packages the tests themselves import are resolved from the app under test, so every test runs against
// the dependency versions that app is built with (requires made by app code resolve there anyway).
const appPackages = ['react', 'react-dom', 'vue', 'vue-router', 'vuex', 'express', 'axios', 'ilc-sdk'];

function project(app) {
    const appDir = path.join(repoRoot, 'apps', app);
    const moduleNameMapper = {
        '\\.css$': require.resolve('identity-obj-proxy'),
        '\\.(png|jpe?g|gif|svg)$': path.join(__dirname, 'stubs', 'file.js'),
    };
    for (const pkg of appPackages) {
        moduleNameMapper[`^${pkg}(/.*)?$`] = `${appDir}/node_modules/${pkg}$1`;
    }
    // Provided at runtime by ILC's import map (registry seeds: rxjs 6.4.0 UMD, @portal/fetchWithCache app)
    // ILC serves the UMD bundle, which also exposes `operators` on the main export
    moduleNameMapper['^rxjs$'] = path.join(__dirname, 'node_modules', 'rxjs', 'bundles', 'rxjs.umd.js');
    moduleNameMapper['^rxjs/(.*)$'] = `${path.join(__dirname, 'node_modules', 'rxjs')}/$1`;
    // planets imports the <Parcel> component as `single-spa-vue/dist/esm/parcel` (webpack 4) or `single-spa-vue/parcel`
    // (webpack 5); Jest enforces the package's `exports` map, which has no `./dist/esm/parcel`
    moduleNameMapper['^single-spa-vue/(dist/esm/)?parcel$'] = `${appDir}/node_modules/single-spa-vue/dist/esm/parcel.js`;
    moduleNameMapper['^@portal/fetchWithCache$'] = path.join(repoRoot, 'apps', 'fetchWithCache', 'src', 'fetchWithCache.js');
    return {
        displayName: app,
        rootDir: repoRoot,
        // the app is a root too, so its files that no test loads still count (as uncovered)
        roots: [path.join(__dirname, app), appDir],
        testMatch: [`<rootDir>/tests/${app}/**/*.test.js`],
        // without `vue`, .vue files no test loads are missing from the coverage report
        moduleFileExtensions: ['js', 'json', 'vue'],
        testEnvironment: require.resolve('jest-environment-jsdom'),
        transform: {
            '\\.[cm]?jsx?$': [
                require.resolve('babel-jest'),
                { configFile: path.join(__dirname, 'babel.config.js'), babelrc: false },
            ],
            '\\.vue$': path.join(__dirname, 'transformers', 'vue.js'),
            '\\.ejs$': path.join(__dirname, 'transformers', 'raw.js'),
        },
        // some app dependencies ship ES modules only
        transformIgnorePatterns: ['/node_modules/(?!(single-spa-vue|ilc-adapter-vue|ilc-adapter-react)/)'],
        moduleNameMapper,
    };
}

module.exports = {
    rootDir: repoRoot,
    projects: apps.map(project),
    // with `projects`, coverage collection is configured globally
    collectCoverageFrom: [
        'apps/*/**/*.{js,vue}',
        '!apps/*/**/node_modules/**',
        '!apps/*/{build,dist}/**',
        '!apps/*/webpack*.js',
    ],
    coverageDirectory: path.join(__dirname, 'coverage'),
    coverageReporters: ['text', 'text-summary', 'lcov'],
    // the run fails if coverage of the apps' sources drops below this
    coverageThreshold: {
        global: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
};
