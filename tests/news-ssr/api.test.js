/**
 * @jest-environment node
 */
import { SOURCES, ARTICLES } from './fixtures';

const BASE = 'https://swapi-e2e.service.spaceship.com/api/v1/sample-ilc-demo-app';
const TEN_MINUTES = 10 * 60 * 1000;

// `axios-client` is a webpack alias: axios-client.js in the client bundle, axios-server.js in the server bundle
function loadApi(client) {
    let api;
    jest.isolateModules(() => {
        jest.doMock('axios-client', () => ({ API: () => client }), { virtual: true });
        api = require('../../apps/news-ssr/src/api/index');
    });
    return api;
}

const ok = (data) => Promise.resolve({ data: { status: 'ok', ...data } });
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('news-ssr: api', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('in the browser (axios-client)', () => {
        it('fetches the news sources', async () => {
            const client = { get: jest.fn(() => ok({ sources: SOURCES })) };
            const { fetchSources } = loadApi(client);

            await expect(fetchSources()).resolves.toEqual({ status: 'ok', sources: SOURCES });
            expect(client.get).toHaveBeenCalledWith(`${BASE}/sources`, { params: null });
        });

        it('fetches the headlines of a source, every time', async () => {
            const client = { get: jest.fn(() => ok({ articles: ARTICLES })) };
            const { fetchHeadlines } = loadApi(client);

            await expect(fetchHeadlines('abc-news')).resolves.toEqual({ status: 'ok', articles: ARTICLES });
            await fetchHeadlines('abc-news');
            expect(client.get).toHaveBeenCalledTimes(2);
            expect(client.get).toHaveBeenCalledWith(`${BASE}/articles/abc-news`, { params: null });
        });

        it('rejects responses that are not "ok"', async () => {
            const client = {
                get: jest.fn(() => Promise.resolve({ data: { status: 'error', message: 'rate limited' } })),
            };
            const { fetchSources } = loadApi(client);

            await expect(fetchSources()).rejects.toBe('News API error: rate limited');
        });

        it('rejects when the request fails', async () => {
            const error = new Error('Network Error');
            const client = { get: jest.fn(() => Promise.reject(error)) };
            const { fetchHeadlines } = loadApi(client);

            await expect(fetchHeadlines('abc-news')).rejects.toBe(error);
        });
    });

    describe('on the server (axios-server)', () => {
        let timers;

        beforeEach(() => {
            timers = [];
            jest.spyOn(global, 'setTimeout').mockImplementation((callback, ms) => {
                timers.push({ callback, ms });
                return timers.length;
            });
        });

        function serverClient(get) {
            return { server: true, cachedItems: new Map(), get: jest.fn(get) };
        }

        it('loads the news sources on start and refreshes them every 10 minutes', async () => {
            const client = serverClient(() => ok({ sources: SOURCES }));
            loadApi(client);

            expect(client.get).toHaveBeenCalledTimes(1);
            expect(client.get).toHaveBeenCalledWith(`${BASE}/sources`, { params: null });
            expect(timers).toEqual([{ callback: expect.any(Function), ms: TEN_MINUTES }]);

            // the cached sources expire before the refresh
            await flush();
            client.cachedItems.clear();
            timers[0].callback();
            expect(client.get).toHaveBeenCalledTimes(2);
            expect(timers).toHaveLength(2);
            expect(timers[1].ms).toBe(TEN_MINUTES);
        });

        it('answers from the cache once a response was "ok"', async () => {
            const client = serverClient((url) =>
                url.endsWith('/sources') ? ok({ sources: SOURCES }) : ok({ articles: ARTICLES }),
            );
            const { fetchSources, fetchHeadlines } = loadApi(client);
            await flush();

            await expect(fetchSources()).resolves.toEqual({ status: 'ok', sources: SOURCES });
            await expect(fetchHeadlines('abc-news')).resolves.toEqual({ status: 'ok', articles: ARTICLES });
            await expect(fetchHeadlines('abc-news')).resolves.toEqual({ status: 'ok', articles: ARTICLES });
            // the sources were loaded on start, the headlines once
            expect(client.get).toHaveBeenCalledTimes(2);
            expect(client.cachedItems.get(`${BASE}/articles/abc-news`)).toEqual({ status: 'ok', articles: ARTICLES });
        });

        it('does not cache failed responses', async () => {
            const client = serverClient((url) =>
                url.endsWith('/sources')
                    ? ok({ sources: SOURCES })
                    : Promise.resolve({ data: { status: 'error', message: 'sourceDoesNotExist' } }),
            );
            const { fetchHeadlines } = loadApi(client);

            await expect(fetchHeadlines('unknown')).rejects.toBe('News API error: sourceDoesNotExist');
            await expect(fetchHeadlines('unknown')).rejects.toBe('News API error: sourceDoesNotExist');
            expect(client.get).toHaveBeenCalledTimes(3);
            expect([...client.cachedItems.keys()]).toEqual([`${BASE}/sources`]);
        });
    });
});

describe('news-ssr: axios clients', () => {
    it('uses plain axios in the browser', () => {
        jest.isolateModules(() => {
            const axios = require('axios');
            const { API } = require('../../apps/news-ssr/src/api/axios-client');

            expect(API()).toBe(axios);
            expect(axios.server).toBeUndefined();
        });
    });

    it('marks axios as the server one and gives it a cache of up to 1000 responses for 10 minutes', () => {
        jest.isolateModules(() => {
            const axios = require('axios');
            const { API } = require('../../apps/news-ssr/src/api/axios-server');

            const client = API();
            expect(client).toBe(axios);
            expect(client.server).toBe(true);
            expect(client.cachedItems.max).toBe(1000);
            expect(client.cachedItems.maxAge).toBe(TEN_MINUTES);
            client.cachedItems.set('key', 'value');
            expect(client.cachedItems.get('key')).toBe('value');
        });
    });
});
