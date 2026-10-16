import fetchWithCache from '@portal/fetchWithCache';
import lifecycles from '../../apps/planets/src/planets';
import { click, flush, nextTick } from './helpers';
import { respondWith } from './fetch-mock';

jest.mock('@portal/fetchWithCache', () => jest.fn());

const tatooine = { id: '1', name: 'Tatooine', climate: 'arid', diameter: '10465', gravity: '1 standard', terrain: 'desert' };
const hoth = { id: '4', name: 'Hoth', climate: 'frozen', diameter: '7200', gravity: '1.1 standard', terrain: 'tundra' };

const lifecycleFunctions = { bootstrap: expect.any(Function), mount: expect.any(Function), unmount: expect.any(Function) };

function domElement() {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
}

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

beforeEach(() => fetchWithCache.mockReset());

describe('planets: single-spa lifecycles', () => {
    it('exports the app and the planet parcel lifecycles', () => {
        expect(lifecycles).toEqual(expect.objectContaining(lifecycleFunctions));
        expect(lifecycles.parcels.planet).toEqual(expect.objectContaining(lifecycleFunctions));
    });

    it('mounts the app at the current route and hands mountParcel down to the demo parcel', async () => {
        window.history.pushState({}, '', '/planets');
        respondWith({ 'planets/?page=1': { results: [tatooine, hoth], next: null } });
        const parcelConfig = {};
        window.ILC = { importParcelFromApp: jest.fn(() => parcelConfig) };
        const mountParcel = jest.fn(() => ({ mountPromise: Promise.resolve(), unmount: () => Promise.resolve() }));
        const errorHandler = jest.fn();
        const el = domElement();

        await lifecycles.bootstrap({ name: '@portal/planets', errorHandler });
        await lifecycles.mount({ name: '@portal/planets', domElement: el, mountParcel });
        await nextTick();

        expect(text(el)).toContain('Tatooine Hoth');
        expect(text(el)).toContain('No planet selected');

        const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        click(el.querySelector('.selectedPlanet button'));
        await flush();
        expect(mountParcel).toHaveBeenCalledWith(parcelConfig, { domElement: expect.any(window.HTMLElement), id: 1 });
        consoleLog.mockRestore();

        await lifecycles.unmount({ name: '@portal/planets' });
        expect(el.innerHTML).toBe('');
        expect(errorHandler).not.toHaveBeenCalled();
        delete window.ILC;
    });

    it('mounts the planet parcel for the given id', async () => {
        respondWith({ 'planets/4': hoth });
        const errorHandler = jest.fn();
        const el = domElement();

        await lifecycles.parcels.planet.bootstrap({ name: 'planet-parcel', errorHandler });
        await lifecycles.parcels.planet.mount({ name: 'planet-parcel', domElement: el, id: 4, mountParcel: jest.fn() });
        await nextTick();

        expect(el.querySelector('h2').textContent).toBe('Hoth');
        expect(text(el)).toContain('Climate frozen');

        await lifecycles.parcels.planet.unmount({ name: 'planet-parcel' });
        expect(el.innerHTML).toBe('');
        expect(errorHandler).not.toHaveBeenCalled();
    });
});
