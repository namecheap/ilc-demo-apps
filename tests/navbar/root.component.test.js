import ReactDOMServer from 'react-dom/server';
import { act } from 'react-dom/test-utils';
import lifecycles from '../../apps/navbar/src/client';
import serverApp from '../../apps/navbar/src/server';
import enLinks from '../../apps/navbar/src/links/en-US.json';
import uaLinks from '../../apps/navbar/src/links/ua-UA.json';

function fakeAppSdk(locale) {
    return {
        intl: {
            get: () => ({ locale }),
            localizeUrl: (url) => url,
            set: jest.fn(),
            onChange: jest.fn(),
        },
    };
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const navLinks = (root) =>
    [...root.querySelectorAll('a.primary-navigation-link')].map((a) => ({
        name: a.textContent,
        href: a.getAttribute('href'),
    }));

describe('navbar server entry', () => {
    const renderToDom = (element) => {
        const container = document.createElement('div');
        container.innerHTML = ReactDOMServer.renderToString(element);
        return container;
    };

    test('renders the given links and highlights the current page', () => {
        const container = renderToDom(serverApp(fakeAppSdk('en-US'), '/people/1', enLinks));

        expect(navLinks(container)).toEqual(enLinks);
        expect(container.querySelector('a[href="/people"]').style.color).toBe('red');
        expect(container.querySelector('a[href="/planets"]').style.color).toBe('');
        expect(container.querySelector('.lang-selector').textContent).toBe('EN/UA');
    });

    test('renders without links', () => {
        const container = renderToDom(serverApp(fakeAppSdk('en-US'), '/'));

        expect(navLinks(container)).toEqual([]);
        expect(container.querySelector('.navbar-app').textContent).toContain('This navbar (React, SSR)');
    });
});

describe('navbar client', () => {
    let container;
    let props;

    const mount = async (appSdk, messages) => {
        document.body.innerHTML = '<div class="before"></div>';
        if (messages) {
            const script = document.createElement('script');
            script.type = 'application/messages';
            script.innerHTML = JSON.stringify(messages);
            document.body.appendChild(script);
        }
        container = document.createElement('div');
        document.body.appendChild(container);

        props = { name: '@portal/navbar', appSdk, domElementGetter: () => container };
        await lifecycles.bootstrap(props);
        await act(async () => {
            await lifecycles.mount(props);
            await flushPromises();
        });
    };

    afterEach(async () => {
        await act(() => lifecycles.unmount(props));
        window.history.replaceState({}, '', '/');
    });

    test('takes the links rendered by the server and drops their script tag', async () => {
        await mount(fakeAppSdk('en-US'), enLinks);

        expect(navLinks(container)).toEqual(enLinks);
        expect(document.querySelector('script[type="application/messages"]')).toBeNull();
    });

    test('highlights the link of the current page as the location changes', async () => {
        await mount(fakeAppSdk('en-US'), enLinks);

        // @reach/router applies location changes in an animation frame
        await act(async () => {
            window.history.pushState({}, '', '/planets/tatooine');
            window.dispatchEvent(new PopStateEvent('popstate'));
            await flushPromises();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        expect(container.querySelector('a[href="/planets"]').style.color).toBe('red');
        expect(container.querySelector('a[href="/people"]').style.color).toBe('');
    });

    test('loads the links of the current locale when the server rendered none', async () => {
        await mount(fakeAppSdk('ua-UA'));

        expect(navLinks(container)).toEqual(uaLinks);
        expect(document.querySelector('.before')).not.toBeNull();
    });

    test('switches links when the locale changes', async () => {
        const appSdk = fakeAppSdk('en-US');
        await mount(appSdk, enLinks);

        expect(appSdk.intl.onChange).toHaveBeenCalledTimes(1);
        const [prepare, commit] = appSdk.intl.onChange.mock.calls[0];
        const langModule = await prepare({ locale: 'ua-UA' });
        expect(langModule.default).toEqual(uaLinks);

        act(() => commit({ locale: 'ua-UA' }, langModule));
        expect(navLinks(container)).toEqual(uaLinks);
    });

    test.each([
        ['EN', 'en-US'],
        ['UA', 'ua-UA'],
    ])('the %s switch sets the %s locale', async (label, locale) => {
        const appSdk = fakeAppSdk('en-US');
        await mount(appSdk, enLinks);

        const link = [...container.querySelectorAll('.lang-selector a')].find((a) => a.textContent === label);
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        act(() => {
            link.dispatchEvent(click);
        });

        expect(click.defaultPrevented).toBe(true);
        expect(appSdk.intl.set).toHaveBeenCalledWith({ locale });
    });

    test('shows an error instead of crashing when rendering fails', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            await mount(fakeAppSdk('en-US'), [{ name: { not: 'renderable' }, href: '/broken' }]);

            expect(container.querySelector('.navbar-app').textContent.trim()).toBe('Error');
        } finally {
            consoleError.mockRestore();
        }
    });
});
