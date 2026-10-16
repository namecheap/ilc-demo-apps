// Helpers for driving the apps' SSR servers the way ILC does. Required from a test, `express` and `ilc-sdk`
// resolve to the copies of the app under test (see moduleNameMapper in jest.config.js).
const path = require('path');

const appsDir = path.resolve(__dirname, '../../apps');

/**
 * Loads `apps/<app>/server.js` without binding its port: `listen` hands over the express app, which tests
 * then drive in-process with supertest. With `development`, the webpack dev middleware branch runs against
 * mocks, which are returned for assertions.
 */
function loadServer(app, { development = false } = {}) {
    const appDir = path.join(appsDir, app);
    const result = {};
    const nodeEnv = process.env.NODE_ENV;
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
        jest.isolateModules(() => {
            if (development) {
                process.env.NODE_ENV = 'development';
                result.webpackConfig = { mode: 'development' };
                result.compiler = {};
                result.webpack = jest.fn(() => result.compiler);
                result.devMiddleware = jest.fn(() => (req, res, next) => next());
                jest.doMock(path.join(appDir, 'webpack.dev.js'), () => result.webpackConfig);
                jest.doMock(require.resolve('webpack', { paths: [appDir] }), () => result.webpack);
                jest.doMock(require.resolve('webpack-dev-middleware', { paths: [appDir] }), () => result.devMiddleware);
            }

            const express = require('express');
            jest.spyOn(express.application, 'listen').mockImplementation(function (port, onListening) {
                result.server = this;
                result.port = port;
                onListening();
                return { close() {} };
            });

            require(path.join(appDir, 'server.js'));
        });
        result.logs = log.mock.calls.map((args) => args.join(' '));
    } finally {
        process.env.NODE_ENV = nodeEnv;
        log.mockRestore();
    }

    return result;
}

const toBase64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64');

/**
 * Query string and headers of an SSR fragment request from ILC: router props and app props travel base64
 * encoded in the query, the original request in `x-request-*` headers.
 */
function ilcRequest({ appId, uri = '/', host = 'localhost', basePath = '/', appProps, intl } = {}) {
    const query = new URLSearchParams({
        routerProps: toBase64({ basePath, reqUrl: uri, fragmentName: appId }),
        appId,
    });
    if (appProps) {
        query.set('appProps', toBase64(appProps));
    }

    const headers = { 'x-request-uri': uri, 'x-request-host': host };
    if (intl) {
        headers['x-request-intl'] = intlHeader(intl);
    }

    return { query: query.toString(), headers };
}

// `x-request-intl` is an Avro record defined by ilc-sdk
function intlHeader({ locale, defaultLocale = 'en-US', supported = ['en-US', 'ua-UA'] }) {
    const { intlSchema } = require('ilc-sdk/dist/server/IlcProtocol');
    return intlSchema
        .toBuffer({
            current: { locale, currency: 'USD' },
            default: { locale: defaultLocale, currency: 'USD' },
            supported: { locale: supported, currency: ['USD'] },
            routingStrategy: 'prefix_except_default',
        })
        .toString('base64');
}

module.exports = { loadServer, ilcRequest };
