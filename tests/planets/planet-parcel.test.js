import fetchWithCache from '@portal/fetchWithCache';
import { Subject, throwError } from 'rxjs';
import PlanetParcel from '../../apps/planets/src/planet-parcel.vue';
import { find, mount, nextTick, text } from './helpers';
import { pending, requestedUrls, respondWith } from './fetch-mock';

jest.mock('@portal/fetchWithCache', () => jest.fn());

const tatooine = { id: '1', name: 'Tatooine', climate: 'arid', diameter: '10465', gravity: '1 standard', terrain: 'desert' };
const hoth = { id: '4', name: 'Hoth', climate: 'frozen', diameter: '7200', gravity: '1.1 standard', terrain: 'tundra' };

const heading = (root) => root.$el.querySelector('h2');
const climate = (root) => root.$el.querySelector('.attribute').textContent.trim();

beforeEach(() => fetchWithCache.mockReset());

describe('planets: planet parcel', () => {
    it('loads the planet of the given id and shows its attributes', async () => {
        const response = new Subject();
        respondWith({ 'planets/1': () => response });
        const root = mount(PlanetParcel, { props: { id: 1 } });

        expect(text(root)).toBe('Loading planed information...');
        expect(heading(root)).toBeNull();

        response.next(tatooine);
        await nextTick();
        expect(heading(root).textContent).toBe('Tatooine');
        expect(climate(root)).toBe('arid');
        expect(text(root)).not.toContain('Loading');
        expect(requestedUrls()).toEqual(['planets/1']);
    });

    it('loads another planet when the id changes', async () => {
        const response = new Subject();
        respondWith({ 'planets/1': tatooine, 'planets/4': () => response });
        const root = mount(PlanetParcel, { props: { id: 1 } });
        await nextTick();
        expect(heading(root).textContent).toBe('Tatooine');

        root.props.id = 4;
        await nextTick();
        expect(text(root)).toBe('Loading planed information...');

        response.next(hoth);
        await nextTick();
        expect(heading(root).textContent).toBe('Hoth');
        expect(requestedUrls()).toEqual(['planets/1', 'planets/4']);
    });

    it('shows and logs the error when the planet fails to load, until another one loads', async () => {
        const error = new Error('Network Error');
        respondWith({ 'planets/1': () => throwError(error), 'planets/4': hoth });
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        const root = mount(PlanetParcel, { props: { id: 1 } });
        await nextTick();

        expect(text(root)).toBe('Error while loading planed data: Network Error');
        expect(consoleError).toHaveBeenCalledWith('Error while loading planed data', error);

        root.props.id = 4;
        await nextTick();
        expect(text(root)).not.toContain('Error');
        expect(heading(root).textContent).toBe('Hoth');
        consoleError.mockRestore();
    });

    it('can reload the planet or load another one by number', async () => {
        respondWith({ 'planets/1': tatooine, 'planets/4': hoth });
        const root = mount(PlanetParcel, { props: { id: 1 } });
        const parcel = find(root, PlanetParcel);

        parcel.fetchWithNum(4);
        await nextTick();
        expect(heading(root).textContent).toBe('Hoth');

        parcel.fetch();
        await nextTick();
        expect(heading(root).textContent).toBe('Tatooine');
        expect(requestedUrls()).toEqual(['planets/1', 'planets/4', 'planets/1']);
    });

    it('cancels the request in flight when unmounted', async () => {
        const request = pending();
        respondWith({ 'planets/1': () => request.observable });
        const root = mount(PlanetParcel, { props: { id: 1 } });

        root.$destroy();
        expect(request.unsubscribed).toBe(1);
    });
});
