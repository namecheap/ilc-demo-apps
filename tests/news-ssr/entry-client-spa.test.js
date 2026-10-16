import { SOURCES, ARTICLES, httpError } from './fixtures';

jest.mock('../../apps/news-ssr/src/api/index', () => ({
    fetchSources: jest.fn(),
    fetchHeadlines: jest.fn(),
}));

const APP_ID = 'news__at__main';
const SSR_STATE = `__${APP_ID}__`;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// a fresh app (router, store, Vue) for every test, as the module keeps them
function loadNews() {
    const loaded = {};
    jest.isolateModules(() => {
        loaded.Vue = require('vue');
        loaded.api = require('../../apps/news-ssr/src/api/index');
        loaded.news = require('../../apps/news-ssr/src/entry-client-spa');
    });
    loaded.Vue.config.productionTip = false;
    loaded.Vue.config.devtools = false;
    loaded.api.fetchSources.mockResolvedValue({ status: 'ok', sources: SOURCES });
    loaded.api.fetchHeadlines.mockResolvedValue({ status: 'ok', articles: ARTICLES });
    return loaded;
}

// the props ILC passes to the lifecycle functions of the app
function ilcProps() {
    const domElement = document.createElement('div');
    domElement.id = 'news-ssr';
    document.body.appendChild(domElement);
    return {
        name: '@portal/news',
        appId: APP_ID,
        domElementGetter: () => domElement,
        errorHandler: jest.fn(),
    };
}

const linkTo = (container, href) =>
    [...container.querySelectorAll('a')].find((link) => link.getAttribute('href') === href);

describe('news-ssr: entry-client-spa', () => {
    let news;
    let api;
    let props;
    let mounted;
    let notFoundEvents;
    const onNotFound = (event) => notFoundEvents.push(event.detail);

    async function mountAt(url) {
        window.history.replaceState(null, '', url);
        await news.bootstrap(props);
        await news.mount(props);
        mounted = true;
        await flush();
        const container = props.domElementGetter();
        return { container, root: container.querySelector('.news-app').__vue__.$root };
    }

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error');
        ({ news, api } = loadNews());
        props = ilcProps();
        mounted = false;
        notFoundEvents = [];
        window.addEventListener('ilc:404', onNotFound);
    });

    afterEach(async () => {
        if (mounted) {
            await news.unmount(props);
        }
        window.removeEventListener('ilc:404', onNotFound);
        delete window[SSR_STATE];
        document.body.innerHTML = '';
        // vue-router warns about the two routes named "404"
        const unexpected = console.warn.mock.calls.filter(
            ([message]) => !String(message).includes('Duplicate named routes definition'),
        );
        expect(unexpected).toEqual([]);
        expect(console.error).not.toHaveBeenCalled();
        jest.restoreAllMocks();
    });

    it('starts from the server rendered state and loads data on client side navigation', async () => {
        window[SSR_STATE] = { sources: { sources: SOURCES }, news: {} };

        const { container } = await mountAt('/news/');

        expect(console.log).toHaveBeenCalledWith('News bootstrap!!');
        expect(console.log).toHaveBeenCalledWith('News mount!!');
        expect(api.fetchSources).not.toHaveBeenCalled();
        expect(window[SSR_STATE]).toBeUndefined();
        expect(container.textContent).toContain('ABC News');

        linkTo(container, '/news/article/abc-news').click();
        await flush();

        expect(api.fetchHeadlines).toHaveBeenCalledWith('abc-news');
        expect(window.location.pathname).toBe('/news/article/abc-news');
        expect(container.textContent).toContain('First headline');
        expect(container.querySelector('a[href="https://news.example/second"]')).not.toBeNull();

        linkTo(container, '/news/').click();
        await flush();

        expect(api.fetchSources).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('BBC Sport');
    });

    it('loads the data itself when there is no server rendered state', async () => {
        const { container } = await mountAt('/news/');

        expect(api.fetchSources).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('Pick a news source');
        expect(container.textContent).toContain('BBC Sport');
    });

    it('clears its markup on unmount', async () => {
        const { container } = await mountAt('/news/');

        await news.unmount(props);
        mounted = false;

        expect(console.log).toHaveBeenCalledWith('News unmount!!');
        expect(container.innerHTML).toBe('');
    });

    it('shows the 404 page for unknown routes and tells ILC about it', async () => {
        const { container } = await mountAt('/news/nonExisting');

        expect(container.textContent).toContain('404 not found component');
        expect(notFoundEvents).toEqual([{ appId: APP_ID }]);
    });

    it('keeps its own 404 page when the url asks to override the ILC one', async () => {
        const { container } = await mountAt('/news/nonExisting?overrideErrorPage=1');

        expect(container.textContent).toContain('404 not found component');
        expect(notFoundEvents).toEqual([]);
    });

    it.each([
        ['an error with code 404', Object.assign(new Error('Not found'), { code: 404 })],
        ['a 404 response', httpError(404)],
        ['a 400 response', httpError(400)],
    ])('shows the 404 page when the news API answers with %s', async (_, error) => {
        api.fetchHeadlines.mockRejectedValue(error);
        const { container } = await mountAt('/news/');

        linkTo(container, '/news/article/abc-news-au34').click();
        await flush();

        expect(api.fetchHeadlines).toHaveBeenCalledWith('abc-news-au34');
        expect(container.textContent).toContain('404 not found component');
        expect(notFoundEvents).toEqual([{ appId: APP_ID }]);
    });

    it('keeps the query of the url on the 404 page', async () => {
        api.fetchHeadlines.mockRejectedValue(httpError(400));
        const { container } = await mountAt('/news/');

        linkTo(container, '/news/article/abc-news-au34?overrideErrorPage=1').click();
        await flush();

        expect(container.textContent).toContain('404 not found component');
        expect(window.location.search).toBe('?overrideErrorPage=1');
        expect(notFoundEvents).toEqual([]);
    });

    it.each([
        ['a 500 response', httpError(500)],
        ['a network error', new Error('Network Error')],
    ])('aborts the navigation when the news API answers with %s', async (_, error) => {
        api.fetchHeadlines.mockRejectedValue(error);
        const { container, root } = await mountAt('/news/');
        const onError = jest.fn();
        root.$router.onError(onError);

        await expect(root.$router.push('/news/article/abc-news')).rejects.toBe(error);

        expect(onError).toHaveBeenCalledWith(error);
        expect(window.location.pathname).toBe('/news/');
        expect(container.textContent).toContain('Pick a news source');
    });

    it('reports errors of the app to ILC', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.42);
        const { container } = await mountAt('/news/');
        const link = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Generate error!');
        link.addEventListener('click', (event) => event.preventDefault());

        link.click();

        expect(props.errorHandler).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'generated error #420' }),
            expect.objectContaining({ context: expect.stringContaining('handler') }),
        );
    });

    describe('beforeRouteUpdate of the app', () => {
        let hook;
        let root;
        const to = { path: '/news/article/abc-news', params: { source: 'abc-news' } };
        const from = { path: '/news/article/bbc-sport', params: { source: 'bbc-sport' } };

        beforeEach(async () => {
            ({ root } = await mountAt('/news/'));
            [hook] = root.$options.beforeRouteUpdate;
        });

        it('continues right away without asyncData', () => {
            const next = jest.fn();

            hook.call(root, to, from, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('loads the data of the new route first', async () => {
            const asyncData = jest.fn(() => Promise.resolve());
            const next = jest.fn();

            hook.call({ $options: { asyncData }, $store: root.$store }, to, from, next);
            await flush();

            expect(asyncData).toHaveBeenCalledWith({ store: root.$store, route: to });
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('passes errors of asyncData on to the router', async () => {
            const error = new Error('boom');
            const next = jest.fn();

            hook.call({ $options: { asyncData: () => Promise.reject(error) }, $store: root.$store }, to, from, next);
            await flush();

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
