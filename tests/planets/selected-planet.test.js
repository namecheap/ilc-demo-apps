import fetchWithCache from '@portal/fetchWithCache';
import { Subject, throwError } from 'rxjs';
import router from '../../apps/planets/src/router';
import { click, flush, mountRoutes, nextTick, text, visit } from './helpers';
import { pending, requestedUrls, respondWith } from './fetch-mock';

jest.mock('@portal/fetchWithCache', () => jest.fn());

const tatooine = {
    id: '1',
    name: 'Tatooine',
    climate: 'arid',
    diameter: '10465',
    gravity: '1 standard',
    terrain: 'desert',
    population: '200000',
    residents: ['https://swapi.example/api/people/1/', 'https://swapi.example/api/people/2/'],
};
const hoth = {
    id: '2',
    name: 'Hoth',
    climate: 'frozen',
    diameter: 'unknown',
    gravity: '1.1 standard',
    terrain: 'tundra, ice caves',
    population: 'unknown',
    residents: [],
};
// as little as SWAPI may know about a planet
const unnamed = { id: '3', name: 'unknown', residents: ['https://swapi.example/api/people/3/'] };
const planets = { results: [tatooine, hoth, unnamed], next: null };

const luke = { id: '1', name: 'Luke Skywalker' };
const c3po = { id: '2', name: 'C-3PO' };
const yoda = { id: '3', name: 'Yoda' };

const people = { 'people/1/': luke, 'people/2/': c3po, 'people/3/': yoda };

function open(mountParcel = jest.fn()) {
    return mountRoutes(router, { provide: { mountParcel } });
}

// [title, value] of every attribute row shown
const attributes = (root) =>
    [...root.$el.querySelectorAll('.planetAttribute')].map((row) => [
        row.querySelector('.attributeTitle').textContent.trim(),
        row.querySelector('.attribute').textContent.replace(/\s+/g, ' ').trim(),
    ]);

const residentLinks = (root) =>
    [...root.$el.querySelectorAll('.resident a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]);

beforeEach(() => fetchWithCache.mockReset());

describe('planets: selected planet', () => {
    it('shows the name with a link that closes it', async () => {
        await visit(router, '/planets/1/attributes');
        respondWith({ 'planets/?page=1': planets });
        const root = open();
        await nextTick();

        expect(root.$el.querySelector('.header').textContent.trim()).toBe('Tatooine');
        const close = root.$el.querySelector('a.close-link');
        expect(close.textContent.trim()).toBe('X');
        expect(close.getAttribute('href')).toBe('/planets');

        click(close);
        await nextTick();
        expect(router.currentRoute.fullPath).toBe('/planets');
        expect(text(root)).toContain('No planet selected');
    });

    it('has tabs for attributes and people, the open one marked active', async () => {
        await visit(router, '/planets/1/attributes');
        respondWith({ 'planets/?page=1': planets, ...people });
        const root = open();
        await nextTick();

        const tabs = () =>
            [...root.$el.querySelectorAll('a.tabLink')].map((a) => [
                a.textContent.trim(),
                a.getAttribute('href'),
                a.classList.contains('active'),
            ]);
        expect(tabs()).toEqual([
            ['Attributes', '/planets/1/attributes', true],
            ['People', '/planets/1/people', false],
        ]);

        click(root.$el.querySelectorAll('a.tabLink')[1]);
        await nextTick();
        expect(router.currentRoute.path).toBe('/planets/1/people');
        expect(tabs()).toEqual([
            ['Attributes', '/planets/1/attributes', false],
            ['People', '/planets/1/people', true],
        ]);
        expect(attributes(root).map(([title]) => title)).toEqual(['Population', 'Notable Residents']);
    });

    it('shows the attributes, with the diameter also in miles', async () => {
        await visit(router, '/planets/1/attributes');
        respondWith({ 'planets/?page=1': planets });
        const root = open();
        await nextTick();

        expect(attributes(root)).toEqual([
            ['Climate', 'arid'],
            ['Diameter', `10465 Kilometers (${10465 * 0.621371} Miles)`],
            ['Gravity', '1 standard'],
            ['Terrain', 'desert'],
        ]);
    });

    it('shows a diameter that is not a number as it is, and nothing when there is none', async () => {
        await visit(router, '/planets/2/attributes');
        respondWith({ 'planets/?page=1': planets });
        const root = open();
        await nextTick();
        expect(attributes(root)[1]).toEqual(['Diameter', 'unknown']);

        await visit(router, '/planets/3/attributes');
        await nextTick();
        expect(attributes(root)).toEqual([
            ['Climate', ''],
            ['Diameter', ''],
            ['Gravity', ''],
            ['Terrain', ''],
        ]);
    });

    it('shows the abbreviated population and links to the residents once they are all loaded', async () => {
        await visit(router, '/planets/1/people');
        const lukeResponse = new Subject();
        respondWith({ 'planets/?page=1': planets, 'people/1/': () => lukeResponse, 'people/2/': c3po });
        const root = open();
        await nextTick();

        expect(attributes(root)[0]).toEqual(['Population', '200k']);
        expect(text(root)).toContain('... Loading');
        expect(residentLinks(root)).toEqual([]);

        lukeResponse.next(luke);
        await nextTick();
        expect(text(root)).not.toContain('... Loading');
        expect(residentLinks(root)).toEqual([
            ['C-3PO', '/people?selected=2'],
            ['Luke Skywalker', '/people?selected=1'],
        ]);
        expect(requestedUrls()).toEqual(['planets/?page=1', 'people/1/', 'people/2/']);
    });

    it('says when a planet has no notable residents', async () => {
        await visit(router, '/planets/2/people');
        respondWith({ 'planets/?page=1': planets });
        const root = open();
        await nextTick();

        expect(attributes(root)[0]).toEqual(['Population', 'unknown']);
        expect(text(root)).toContain('No notable residents');
        expect(text(root)).not.toContain('... Loading');
        expect(root.$el.querySelector('.residents')).toBeNull();
    });

    it('shows no population when it is not known at all', async () => {
        await visit(router, '/planets/3/people');
        respondWith({ 'planets/?page=1': planets, ...people });
        const root = open();
        await nextTick();

        expect(attributes(root)[0]).toEqual(['Population', '']);
        expect(residentLinks(root)).toEqual([['Yoda', '/people?selected=3']]);
    });

    it('reports residents that fail to load', async () => {
        await visit(router, '/planets/1/people');
        const error = new Error('Request failed with status code 404');
        respondWith({ 'planets/?page=1': planets, 'people/1/': luke, 'people/2/': () => throwError(error) });
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        const root = open();
        await nextTick();

        expect(consoleError).toHaveBeenCalledWith(error);
        expect(text(root)).toContain('Error loading');
        expect(text(root)).not.toContain('... Loading');
        expect(residentLinks(root)).toEqual([]);
        consoleError.mockRestore();
    });

    it('loads the residents of the next planet selected', async () => {
        await visit(router, '/planets/1/people');
        respondWith({ 'planets/?page=1': planets, ...people });
        const root = open();
        await nextTick();
        expect(residentLinks(root).map(([name]) => name)).toEqual(['Luke Skywalker', 'C-3PO']);

        await visit(router, '/planets/3/people');
        await nextTick();
        expect(residentLinks(root)).toEqual([['Yoda', '/people?selected=3']]);
        expect(requestedUrls()).toEqual(['planets/?page=1', 'people/1/', 'people/2/', 'people/3/']);
    });

    it('cancels the resident requests in flight when the people tab is closed', async () => {
        await visit(router, '/planets/3/people');
        const request = pending();
        respondWith({ 'planets/?page=1': planets, 'people/3/': () => request.observable });
        const root = open();
        await nextTick();
        expect(text(root)).toContain('... Loading');

        await visit(router, '/planets/3/attributes');
        await nextTick();
        expect(request.unsubscribed).toBe(1);
        expect(attributes(root)[0][0]).toBe('Climate');
    });
});

describe('planets: demo parcel of the people app', () => {
    const parcelConfig = { bootstrap: jest.fn(), mount: jest.fn(), unmount: jest.fn() };

    beforeEach(() => {
        window.ILC = { importParcelFromApp: jest.fn(() => parcelConfig) };
    });

    afterEach(() => {
        delete window.ILC;
    });

    function fakeMountParcel() {
        const parcel = {
            mountPromise: Promise.resolve(),
            update: jest.fn(() => Promise.resolve()),
            unmount: jest.fn(() => Promise.resolve()),
        };
        return { parcel, mountParcel: jest.fn(() => parcel) };
    }

    it('mounts the person parcel with the id entered when no planet is selected', async () => {
        await visit(router, '/planets');
        respondWith({ 'planets/?page=1': planets });
        const { parcel, mountParcel } = fakeMountParcel();
        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        const root = open(mountParcel);
        await nextTick();

        const input = root.$el.querySelector('.selectedPlanet input');
        expect(input.value).toBe('1');
        expect(mountParcel).not.toHaveBeenCalled();

        input.value = '4';
        input.dispatchEvent(new window.Event('input'));
        click(root.$el.querySelector('.selectedPlanet button'));
        await flush();

        expect(window.ILC.importParcelFromApp).toHaveBeenCalledWith('@portal/people', 'person');
        expect(mountParcel).toHaveBeenCalledTimes(1);
        const [config, props] = mountParcel.mock.calls[0];
        expect(config).toBe(parcelConfig);
        expect(props).toEqual({ domElement: expect.any(window.HTMLElement), id: '4' });
        expect(root.$el.contains(props.domElement)).toBe(true);
        expect(consoleLog).toHaveBeenCalledWith('HERE', '4');

        root.$destroy();
        await flush();
        expect(parcel.unmount).toHaveBeenCalledTimes(1);
        consoleLog.mockRestore();
    });
});
