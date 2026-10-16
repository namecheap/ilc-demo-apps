import router from '../../apps/planets/src/router';
import PlanetList from '../../apps/planets/src/planet-list/planet-list.vue';
import { click, mount, nextTick, text, visit } from './helpers';

// the router loads the whole app; nothing is requested in these tests
jest.mock('@portal/fetchWithCache', () => jest.fn());

const planets = [
    { id: '1', name: 'Tatooine' },
    { id: '2', name: 'Alderaan' },
];

describe('planets: planet list', () => {
    it('links every planet to its attributes, keeping the current language', async () => {
        await visit(router, '/ua/planets');
        const root = mount(PlanetList, { router, props: { loading: false, nextPage: true, planets } });

        const links = [...root.$el.querySelectorAll('a.planet')];
        expect(links.map((a) => [a.textContent.trim(), a.getAttribute('href')])).toEqual([
            ['Tatooine', '/ua/planets/1/attributes'],
            ['Alderaan', '/ua/planets/2/attributes'],
        ]);

        await visit(router, '/planets');
        await nextTick();
        expect(root.$el.querySelector('a.planet').getAttribute('href')).toBe('/planets/1/attributes');
    });

    it('asks for more planets when the button is clicked', () => {
        const fetchPlanets = jest.fn();
        const root = mount(PlanetList, {
            router,
            props: { loading: false, nextPage: true, planets: [] },
            listeners: { fetchPlanets },
        });
        const button = root.$el.querySelector('button');

        expect(button.textContent.trim()).toBe('Fetch More planets');
        expect(button.disabled).toBe(false);
        click(button);
        expect(fetchPlanets).toHaveBeenCalledTimes(1);
        expect(text(root)).not.toContain('Loading ...');
    });

    it('disables the button while loading and when there are no more pages', async () => {
        const root = mount(PlanetList, { router, props: { loading: true, nextPage: true, planets } });
        const button = root.$el.querySelector('button');

        expect(button.disabled).toBe(true);
        expect(text(root)).toContain('Loading ...');

        root.props.loading = false;
        await nextTick();
        expect(button.disabled).toBe(false);
        expect(text(root)).not.toContain('Loading ...');

        root.props.nextPage = false;
        await nextTick();
        expect(button.disabled).toBe(true);
    });
});
