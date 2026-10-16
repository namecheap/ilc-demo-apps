/**
 * @jest-environment node
 */
import path from 'path';
import vm from 'vm';
import nock from 'nock';
import request from 'supertest';
import express from 'express';
import { SOURCES, ARTICLES } from './fixtures';

const APP_DIR = path.resolve(__dirname, '../../apps/news-ssr');
const API = 'https://swapi-e2e.service.spaceship.com';
const BASE = '/api/v1/sample-ilc-demo-app';
const APP_ID = 'news__at__main';

// The SSR bundle runs in the main Node.js context (runInNewContext: false), outside Jest's sandbox, so the
// 10-minute refresh of the news sources it schedules is a real timer. It is collected and cleared after the tests.
const nodeGlobal = vm.runInThisContext('this');
const realSetTimeout = nodeGlobal.setTimeout;
const longTimers = [];

const decodeHeader = (value) => Buffer.from(value, 'base64').toString('utf8');

// A fragment request as ILC sends it
function ilcRequest(app, uri) {
    const routerProps = Buffer.from(JSON.stringify({ basePath: '/', reqUrl: uri, fragmentName: APP_ID })).toString(
        'base64',
    );
    return request(app)
        .get(uri)
        .query({ routerProps, appId: APP_ID })
        .set('x-request-uri', uri)
        .set('x-request-host', 'demo.local');
}

describe('news-ssr: server', () => {
    let app;
    let listen;

    beforeAll(() => {
        nodeGlobal.setTimeout = function (callback, ms, ...args) {
            const timer = realSetTimeout.call(this, callback, ms, ...args);
            if (ms >= 60 * 1000) {
                longTimers.push(timer);
            }
            return timer;
        };

        nock.disableNetConnect();
        nock.enableNetConnect('127.0.0.1');
        nock(API)
            .persist()
            .get(`${BASE}/sources`)
            .reply(200, { status: 'ok', sources: SOURCES })
            .get(`${BASE}/articles/abc-news`)
            .reply(200, { status: 'ok', articles: ARTICLES })
            .get(`${BASE}/articles/unknown-404`)
            .reply(404, { status: 'error', code: 'sourceDoesNotExist' })
            .get(`${BASE}/articles/unknown-400`)
            .reply(400, { status: 'error', code: 'sourceDoesNotExist' })
            .get(`${BASE}/articles/broken`)
            .reply(500, { status: 'error', code: 'unexpectedError' });

        jest.spyOn(console, 'log').mockImplementation(() => {});
        // logs of the bundle go to the console of the main context
        jest.spyOn(nodeGlobal.console, 'log').mockImplementation(() => {});
        // vue-router warns about the two routes named "404" every time the bundle creates a router
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        // server.js starts listening on import: capture the app instead and serve it in-process with supertest
        listen = jest.spyOn(express.application, 'listen').mockImplementation(function (port, callback) {
            app = this;
            callback();
            return { close() {} };
        });

        // the template and the static files are looked up relative to the working directory
        const cwd = process.cwd();
        process.chdir(APP_DIR);
        try {
            require('../../apps/news-ssr/server');
        } finally {
            process.chdir(cwd);
        }
    });

    afterAll(() => {
        nodeGlobal.setTimeout = realSetTimeout;
        longTimers.forEach((timer) => clearTimeout(timer));
        nock.cleanAll();
        nock.enableNetConnect();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        const unexpected = console.warn.mock.calls.filter(
            ([message]) => !String(message).includes('Duplicate named routes definition'),
        );
        expect(unexpected).toEqual([]);
        console.warn.mockClear();
    });

    it('listens on the port from PORT.json', () => {
        expect(listen).toHaveBeenCalledWith(8239, expect.any(Function));
        expect(console.log).toHaveBeenCalledWith('News server started at port 8239');
    });

    it('allows cross-origin requests', async () => {
        const res = await ilcRequest(app, '/news/');

        expect(res.headers['access-control-allow-origin']).toBe('*');
    });

    it('renders the list of news sources with its state and page metadata for ILC', async () => {
        const res = await ilcRequest(app, '/news/');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/^text\/html/);
        expect(res.text).toContain('Pick a news source');
        expect(res.text).toContain('ABC News');
        expect(res.text).toContain('BBC Sport');
        expect(res.text).toContain('href="/news/article/abc-news"');
        // the state is handed over to the client side under the window key of the fragment
        expect(res.text).toContain(`window.__${APP_ID}__=`);
        expect(res.text).toContain('Your trusted source for breaking news.');

        expect(decodeHeader(res.headers['x-head-title'])).toMatch(/<title[^>]*>Headline News<\/title>/);
        const meta = decodeHeader(res.headers['x-head-meta']);
        expect(meta).toContain('This is the headlines apps description');
        expect(meta).toContain('news,headlines,vue,demo');
        expect(res.headers.link).toContain('</single_spa.js>; rel="fragment-script"');
        expect(res.headers.link).toMatch(/<\/common\.\w+\.css>; rel="stylesheet"/);
        expect(res.headers['x-ilc-override']).toBeUndefined();
    });

    it('renders the headlines of a news source', async () => {
        const res = await ilcRequest(app, '/news/article/abc-news');

        expect(res.status).toBe(200);
        expect(res.text).toContain('First headline');
        expect(res.text).toContain('Second headline');
        expect(res.text).toContain('href="https://news.example/first"');
        expect(decodeHeader(res.headers['x-head-title'])).toContain('Articles - Headline News');
    });

    it('answers 404 without state for unknown routes', async () => {
        const res = await ilcRequest(app, '/news/nonExisting');

        expect(res.status).toBe(404);
        expect(res.text).toContain('404 not found component');
        // the client side starts from scratch after an "errored" render
        expect(res.text).not.toContain(`window.__${APP_ID}__=`);
        expect(decodeHeader(res.headers['x-head-title'])).toContain('News - Not found');
        expect(res.headers['x-ilc-override']).toBeUndefined();
    });

    it('asks ILC to keep its own content of the error page when the url says so', async () => {
        const res = await ilcRequest(app, '/news/nonExisting?overrideErrorPage=1');

        expect(res.status).toBe(404);
        expect(res.headers['x-ilc-override']).toBe('error-page-content');
    });

    it.each([404, 400])('answers 404 when the news API responds %i for the source', async (status) => {
        const res = await ilcRequest(app, `/news/article/unknown-${status}`);

        expect(res.status).toBe(404);
        expect(res.text).toContain('404 not found component');
        expect(nodeGlobal.console.log).toHaveBeenCalledWith('Not found error from API caught! Re-rendering app...');
    });

    it('answers 500 when the news API fails', async () => {
        const res = await ilcRequest(app, '/news/article/broken');

        expect(res.status).toBe(500);
        expect(res.text).toBe('Internal server error');
        expect(console.log).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Request failed with status code 500' }),
        );
    });

    describe('assets discovery', () => {
        const publicHost = process.env.PUBLIC_HOST;

        beforeEach(() => {
            process.env.PUBLIC_HOST = 'news.local';
        });

        afterEach(() => {
            if (publicHost === undefined) {
                delete process.env.PUBLIC_HOST;
            } else {
                process.env.PUBLIC_HOST = publicHost;
            }
        });

        it('lists the client bundles at the public host', async () => {
            const res = await request(app).get('/_spa/dev/assets-discovery');

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/^application\/json/);
            expect(res.body.spaBundle).toBe('http://news.local:8239/single_spa.js');
            expect(res.body.cssBundle).toMatch(/^http:\/\/news\.local:8239\/common\.\w+\.css$/);
        });
    });

    it('serves the built client bundle', async () => {
        const res = await request(app).get('/single_spa.js');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/javascript/);
    });
});
