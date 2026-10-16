/**
 * @jest-environment node
 */
import nock from 'nock';

const API = 'https://swapi-e2e.service.spaceship.com';
const BASE = '/api/v1/sample-ilc-demo-app/';

// a fresh module (and so a fresh in-memory cache) for every test
function loadFetchWithCache() {
    let fetchWithCache;
    jest.isolateModules(() => {
        fetchWithCache = require('../../apps/fetchWithCache/src/fetchWithCache').default;
    });
    return fetchWithCache;
}

const firstValue = (observable) =>
    new Promise((resolve, reject) => observable.subscribe({ next: resolve, error: reject }));

describe('fetchWithCache', () => {
    beforeAll(() => nock.disableNetConnect());
    afterEach(() => {
        nock.cleanAll();
        jest.restoreAllMocks();
    });
    afterAll(() => nock.enableNetConnect());

    it('requests the url relative to the SWAPI base and adds the entity id', async () => {
        const fetchWithCache = loadFetchWithCache();
        nock(API).get(`${BASE}people/1/`).reply(200, { name: 'Luke', url: 'https://swapi.example/api/people/1/' });

        await expect(firstValue(fetchWithCache('people/1/'))).resolves.toEqual({
            id: '1',
            name: 'Luke',
            url: 'https://swapi.example/api/people/1/',
        });
    });

    it('adds ids to list results and caches every result by its own url', async () => {
        const fetchWithCache = loadFetchWithCache();
        const results = [
            { name: 'Luke', url: 'people/1/' },
            { name: 'Leia', url: 'people/5/' },
        ];
        nock(API).get(`${BASE}people/`).query({ page: 1 }).reply(200, { count: 2, results });

        await expect(firstValue(fetchWithCache('people/?page=1'))).resolves.toEqual({
            count: 2,
            results: [
                { id: '1', name: 'Luke', url: 'people/1/' },
                { id: '5', name: 'Leia', url: 'people/5/' },
            ],
        });
        // served from the cache filled by the list request: no HTTP mock exists for it
        await expect(firstValue(fetchWithCache('people/5/'))).resolves.toEqual({ id: '5', name: 'Leia', url: 'people/5/' });
    });

    it('returns responses without url or results unchanged', async () => {
        const fetchWithCache = loadFetchWithCache();
        nock(API).get(`${BASE}films`).reply(200, { count: 0 });

        await expect(firstValue(fetchWithCache('films'))).resolves.toEqual({ count: 0 });
    });

    it('serves repeated requests from the cache for ten minutes, then fetches again', async () => {
        const fetchWithCache = loadFetchWithCache();
        let now = 1_000_000;
        jest.spyOn(Date, 'now').mockImplementation(() => now);
        nock(API).get(`${BASE}planets/2/`).reply(200, { name: 'Alderaan', url: 'planets/2/' });

        await firstValue(fetchWithCache('planets/2/'));
        now += 10 * 60 * 1000 - 1;
        await expect(firstValue(fetchWithCache('planets/2/'))).resolves.toMatchObject({ name: 'Alderaan' });

        now += 1;
        nock(API).get(`${BASE}planets/2/`).reply(200, { name: 'Alderaan (refreshed)', url: 'planets/2/' });
        await expect(firstValue(fetchWithCache('planets/2/'))).resolves.toMatchObject({ name: 'Alderaan (refreshed)' });
        expect(nock.isDone()).toBe(true);
    });

    it('always issues GET requests and passes the other axios options through', async () => {
        const fetchWithCache = loadFetchWithCache();
        nock(API, { reqheaders: { 'x-test': 'yes' } }).get(`${BASE}starships/9/`).reply(200, { url: 'starships/9/' });

        await expect(
            firstValue(fetchWithCache('starships/9/', { method: 'post', headers: { 'x-test': 'yes' } })),
        ).resolves.toEqual({ id: '9', url: 'starships/9/' });
    });

    it('propagates request errors', async () => {
        const fetchWithCache = loadFetchWithCache();
        nock(API).get(`${BASE}people/404/`).reply(404, { detail: 'Not found' });

        await expect(firstValue(fetchWithCache('people/404/'))).rejects.toThrow(/404/);
    });
});
