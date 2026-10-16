// The app and its `person` parcel driven through their single-spa lifecycles, the way ILC mounts them
import { act, Simulate } from 'react-dom/test-utils';
import { throwError } from 'rxjs';
import fetchWithCache from '@portal/fetchWithCache';
import lifecycles from '../../apps/people/src/client-entry';
import { swapi, flush, text, luke } from './swapi';

jest.mock('@portal/fetchWithCache', () => ({ __esModule: true, default: jest.fn() }));

const mounted = [];

function createProps(overrides = {}) {
    const domElement = document.createElement('div');
    document.body.appendChild(domElement);
    const parcel = {
        mountPromise: Promise.resolve(),
        getStatus: () => 'MOUNTED',
        update: jest.fn(() => Promise.resolve()),
        unmount: jest.fn(() => Promise.resolve()),
    };
    return {
        name: '@portal/people',
        domElement,
        getCurrentBasePath: () => '/people',
        appSdk: { intl: { localizeUrl: jest.fn((url) => url), onChange: jest.fn() } },
        mountParcel: jest.fn(() => parcel),
        parcel,
        ...overrides,
    };
}

async function mount(adapter, props) {
    await adapter.bootstrap(props);
    await act(async () => {
        await adapter.mount(props);
    });
    mounted.push([adapter, props]);
    return props.domElement;
}

function click(element) {
    act(() => {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    });
}

const personLinks = (container) => [...container.querySelectorAll('a[href*="selected="]')];
const fetchMoreButton = (container) =>
    [...container.querySelectorAll('button')].find((button) => text(button) === 'Fetch More people');
const requested = () => fetchWithCache.mock.calls.map(([path]) => path);

beforeEach(() => {
    fetchWithCache.mockReset();
    fetchWithCache.mockImplementation(swapi);
    window.history.replaceState(null, '', '/people');
});

afterEach(async () => {
    while (mounted.length) {
        const [adapter, props] = mounted.pop();
        await act(async () => {
            await adapter.unmount(props);
        });
        props.domElement.remove();
    }
    jest.restoreAllMocks();
});

describe('people app', () => {
    test('lists people page by page and unmounts cleanly', async () => {
        const container = await mount(lifecycles, createProps());

        expect(text(container)).toContain('Loading ...');
        expect(fetchMoreButton(container).disabled).toBe(true);

        await flush();
        expect(personLinks(container).map(text)).toEqual(['Luke Skywalker', 'C-3PO']);
        expect(personLinks(container)[0].getAttribute('href')).toBe('/people/?selected=1');
        expect(fetchMoreButton(container).disabled).toBe(false);

        click(fetchMoreButton(container));
        // the list stays visible while the next page loads
        expect(personLinks(container)).toHaveLength(2);
        expect(text(container)).toContain('Loading ...');

        await flush();
        expect(personLinks(container).map(text)).toEqual(['Luke Skywalker', 'C-3PO', 'R2-D2']);
        // that was the last page
        expect(fetchMoreButton(container)).toBeUndefined();
        expect(requested()).toEqual(expect.arrayContaining(['people/?page=1', 'people/?page=2']));

        const [adapter, props] = mounted.pop();
        await act(async () => {
            await adapter.unmount(props);
        });
        expect(container.innerHTML).toBe('');
        props.domElement.remove();
    });

    test('shows the details of the person selected in the URL', async () => {
        window.history.replaceState(null, '', '/people?selected=1');
        const container = await mount(lifecycles, createProps());
        await flush();

        const details = text(container.querySelector('.selectedPerson'));
        expect(details).toContain('Name Luke Skywalker');
        expect(details).toMatch(/height 172cm \(5\.64\d*ft\)/);
        expect(details).toContain('Mass 77');
        expect(details).toContain('Hair color blond');
        expect(details).toContain('Gender male');
        expect(details).toContain('Birth Year 19BBY');

        const homeworld = container.querySelector('.homeworld a');
        expect(text(homeworld)).toBe('Tatooine');
        expect(homeworld.getAttribute('href')).toBe('/planets/1/attributes');

        const posters = [...container.querySelectorAll('img')];
        expect(posters.map((img) => img.alt)).toEqual(['A New Hope', 'The Empire Strikes Back']);
        expect(posters[0].getAttribute('src')).toMatch(/^https:\/\/m\.media-amazon\.com\//);
    });

    test('a click on a person in the list selects them', async () => {
        const container = await mount(lifecycles, createProps());
        await flush();
        expect(text(container)).toContain('No one selected');

        click(personLinks(container)[1]);
        expect(window.location.search).toBe('?selected=2');
        expect(text(container)).toContain('Name C-3PO');
        // homeworld and films load after the selection
        expect(text(container.querySelector('.homeworld'))).toBe('... Loading');
        expect(text(container)).toContain('Films ... Loading');

        await flush();
        expect(text(container.querySelector('.homeworld'))).toBe('Tatooine');
        expect([...container.querySelectorAll('img')].map((img) => img.alt)).toEqual(['A New Hope']);

        click(personLinks(container)[0]);
        expect(window.location.search).toBe('?selected=1');
        expect(text(container)).toContain('Name Luke Skywalker');
        await flush();
        expect([...container.querySelectorAll('img')].map((img) => img.alt)).toEqual([
            'A New Hope',
            'The Empire Strikes Back',
        ]);
    });

    test('hovering a film poster shows the film credits', async () => {
        window.history.replaceState(null, '', '/people?selected=1');
        const container = await mount(lifecycles, createProps());
        await flush();

        const film = container.querySelector('img[alt="A New Hope"]').parentElement;
        expect(text(film)).toBe('');

        act(() => {
            Simulate.mouseEnter(film);
        });
        expect(text(film)).toBe(
            'Directed By George Lucas Released on 1977-05-25 Produced by Gary Kurtz, Rick McCallum',
        );

        act(() => {
            Simulate.mouseLeave(film);
        });
        expect(text(film)).toBe('');
    });

    test('mounts the planet parcel of the planets app for the entered planet ID', async () => {
        const props = createProps();
        const container = await mount(lifecycles, props);
        await flush();

        const input = container.querySelector('input[type="text"]');
        const open = [...container.querySelectorAll('button')].find((button) => text(button) === 'Open');
        expect(input.value).toBe('1');
        expect(props.mountParcel).not.toHaveBeenCalled();

        act(() => {
            Simulate.change(input, { target: { value: '7' } });
        });
        act(() => {
            Simulate.click(open);
        });
        await flush();

        expect(props.mountParcel).toHaveBeenCalledTimes(1);
        const [, parcelProps] = props.mountParcel.mock.calls[0];
        expect(parcelProps).toEqual(
            expect.objectContaining({ id: 7, loadingConfig: { appName: '@portal/planets', parcelName: 'planet' } }),
        );
        expect(container.contains(parcelProps.domElement)).toBe(true);

        act(() => {
            Simulate.change(input, { target: { value: '9' } });
        });
        act(() => {
            Simulate.click(open);
        });
        await flush();
        expect(props.mountParcel).toHaveBeenCalledTimes(1);
        expect(props.parcel.update).toHaveBeenLastCalledWith(expect.objectContaining({ id: 9 }));
    });

    test('re-renders under the localized base path after a locale change', async () => {
        const props = createProps();
        const container = await mount(lifecycles, props);
        await flush();
        expect(props.appSdk.intl.localizeUrl).toHaveBeenCalledWith('/people');
        expect(props.appSdk.intl.onChange).toHaveBeenCalledTimes(1);

        const [prepareForChange, performChange] = props.appSdk.intl.onChange.mock.calls[0];
        props.appSdk.intl.localizeUrl.mockImplementation((url) => `/ua${url}`);
        window.history.replaceState(null, '', '/ua/people');
        act(() => {
            prepareForChange();
            performChange();
        });
        await flush();

        expect(personLinks(container)[0].getAttribute('href')).toBe('/ua/people/?selected=1');
        // the router (and so the page) is re-created
        expect(requested().filter((path) => path === 'people/?page=1')).toHaveLength(2);
    });

    test('keeps showing the loading state when people cannot be fetched', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});
        fetchWithCache.mockImplementation((path) =>
            path === 'people/?page=1' ? throwError(new Error('SWAPI is down')) : swapi(path),
        );

        const container = await mount(lifecycles, createProps());
        await flush();

        expect(text(container)).toContain('Loading ...');
        expect(personLinks(container)).toHaveLength(0);
        expect(log).toHaveBeenCalledWith('err', new Error('SWAPI is down'));
    });

    test('renders an error message instead of the page when the page throws', async () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        fetchWithCache.mockImplementation(() => {
            throw new Error('boom');
        });

        const container = await mount(lifecycles, createProps());
        await flush();

        expect(text(container)).toBe('Error');
        expect(error).toHaveBeenCalled();
    });
});

describe('person parcel', () => {
    const parcelProps = (props) => createProps({ name: 'person-parcel', ...props });

    test('loads and shows the person with the given ID', async () => {
        const container = await mount(lifecycles.parcels.person, parcelProps({ id: '1' }));
        expect(text(container)).toBe('Loading information about selected person...');

        await flush();
        expect(text(container)).toContain(`Name ${luke.name}`);
        expect(text(container.querySelector('.homeworld'))).toBe('Tatooine');
        expect(requested()).toContain('people/1/');
    });

    test('loads another person when the ID changes', async () => {
        const props = parcelProps({ id: '1' });
        const container = await mount(lifecycles.parcels.person, props);
        await flush();

        await act(async () => {
            await lifecycles.parcels.person.update({ ...props, id: '3' });
        });
        expect(text(container)).toBe('Loading information about selected person...');

        await flush();
        expect(text(container)).toContain('Name R2-D2');
        expect(text(container.querySelector('.homeworld'))).toBe('Naboo');
        expect(requested()).toContain('people/3/');
    });

    test('shows errors for a homeworld and films that cannot be loaded', async () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});

        const container = await mount(lifecycles.parcels.person, parcelProps({ id: '4' }));
        await flush();

        expect(text(container)).toContain('Name Unknown');
        expect(text(container.querySelector('.homeworld'))).toBe('Error Loading');
        expect(text(container)).toMatch(/Films Error$/);
        expect(error).toHaveBeenCalledWith(new Error('Request failed: planets/404/'));
    });

    test('shows why the person could not be loaded', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const container = await mount(lifecycles.parcels.person, parcelProps({ id: '404' }));
        await flush();

        expect(text(container)).toBe('Error when loading data about selected person: Request failed: people/404/');
        expect(warn).toHaveBeenCalledWith('Error when loading data about selected person:', expect.any(Error));
    });
});
