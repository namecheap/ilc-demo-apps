import fetchWithCache from '@portal/fetchWithCache';
import { Subject, throwError } from 'rxjs';
import router from '../../apps/planets/src/router';
import PlanetPage from '../../apps/planets/src/planet-page.vue';
import { click, find, mountRoutes, nextTick, text, visit } from './helpers';
import { pending, requestedUrls, respondWith } from './fetch-mock';

jest.mock('@portal/fetchWithCache', () => jest.fn());

const page1 = {
    results: [
        { id: '1', name: 'Tatooine' },
        { id: '2', name: 'Alderaan' },
    ],
    next: 'https://swapi.example/api/planets/?page=2',
};
const page2 = { results: [{ id: '3', name: 'Yavin IV' }], next: null };

const openPlanets = () => mountRoutes(router, { provide: { mountParcel: jest.fn() } });
const planetNames = (root) => [...root.$el.querySelectorAll('a.planet')].map((a) => a.textContent.trim());
const fetchButton = (root) => root.$el.querySelector('.planetList button');

beforeEach(() => fetchWithCache.mockReset());

describe('planets: planet page', () => {
    it('loads the first page of planets when opened and the next ones on demand', async () => {
        await visit(router, '/planets');
        respondWith({ 'planets/?page=1': page1, 'planets/?page=2': page2 });
        const root = openPlanets();
        await nextTick();

        expect(planetNames(root)).toEqual(['Tatooine', 'Alderaan']);
        expect(fetchButton(root).disabled).toBe(false);
        expect(text(root)).toContain('No planet selected');

        click(fetchButton(root));
        await nextTick();
        expect(planetNames(root)).toEqual(['Tatooine', 'Alderaan', 'Yavin IV']);
        // the last page has no `next`
        expect(fetchButton(root).disabled).toBe(true);
        expect(requestedUrls()).toEqual(['planets/?page=1', 'planets/?page=2']);
    });

    it('shows that planets are loading until they arrive', async () => {
        await visit(router, '/planets');
        const response = new Subject();
        respondWith({ 'planets/?page=1': () => response });
        const root = openPlanets();
        await nextTick();

        expect(text(root)).toContain('Loading ...');
        expect(fetchButton(root).disabled).toBe(true);

        response.next(page1);
        await nextTick();
        expect(text(root)).not.toContain('Loading ...');
        expect(planetNames(root)).toEqual(['Tatooine', 'Alderaan']);
    });

    it('stops loading and logs the error when planets fail to load', async () => {
        await visit(router, '/planets');
        const error = new Error('Network Error');
        respondWith({ 'planets/?page=1': () => throwError(error) });
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        const root = openPlanets();
        await nextTick();

        expect(consoleError).toHaveBeenCalledWith(error);
        expect(text(root)).not.toContain('Loading ...');
        expect(planetNames(root)).toEqual([]);
        // a retry is possible
        expect(fetchButton(root).disabled).toBe(false);
        consoleError.mockRestore();
    });

    it('shows the planet selected in the route', async () => {
        await visit(router, '/planets/2/attributes');
        respondWith({ 'planets/?page=1': page1 });
        const root = openPlanets();
        await nextTick();

        expect(root.$el.querySelector('.header').textContent.trim()).toBe('Alderaan');
        expect(text(root)).not.toContain('No planet selected');
    });

    it('shows no planet when the selected one is not loaded', async () => {
        await visit(router, '/planets/42/attributes');
        respondWith({ 'planets/?page=1': page1 });
        const root = openPlanets();
        await nextTick();

        expect(root.$el.querySelector('.header')).toBeNull();
        expect(text(root)).toContain('No planet selected');
    });

    it('can load a given page', async () => {
        await visit(router, '/planets');
        respondWith({ 'planets/?page=1': page1, 'planets/?page=5': page2 });
        const root = openPlanets();
        await nextTick();

        find(root, PlanetPage).fetchWithNum(5);
        await nextTick();
        expect(requestedUrls()).toEqual(['planets/?page=1', 'planets/?page=5']);
        expect(planetNames(root)).toEqual(['Tatooine', 'Alderaan', 'Yavin IV']);
    });

    it('cancels the requests in flight when closed', async () => {
        await visit(router, '/planets');
        const request = pending();
        respondWith({ 'planets/?page=1': () => request.observable });
        const root = openPlanets();
        await nextTick();
        expect(request.unsubscribed).toBe(0);

        root.$destroy();
        expect(request.unsubscribed).toBe(1);
    });
});
