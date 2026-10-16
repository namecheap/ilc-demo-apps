/**
 * @jest-environment node
 */
import { SOURCES, ARTICLES, httpError } from './fixtures';

jest.mock('../../apps/news-ssr/src/api/index', () => ({
    fetchSources: jest.fn(),
    fetchHeadlines: jest.fn(),
}));

const { fetchSources, fetchHeadlines } = require('../../apps/news-ssr/src/api/index');
const createApp = require('../../apps/news-ssr/src/entry-server').default;
const { createRenderer } = require('../../apps/news-ssr/node_modules/vue-server-renderer');

const renderer = createRenderer();

// what the server does with the bundle: create the app for the url, then render it
async function render(url) {
    const context = { url, appId: 'news__at__main' };
    const app = await createApp(context);
    const html = await renderer.renderToString(app);
    return { context, html, title: context.meta.inject().title.text() };
}

describe('news-ssr: entry-server', () => {
    beforeEach(() => {
        fetchSources.mockResolvedValue({ status: 'ok', sources: SOURCES });
        fetchHeadlines.mockResolvedValue({ status: 'ok', articles: ARTICLES });
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error');
    });

    afterEach(() => {
        // vue-router warns about the two routes named "404"
        const unexpected = console.warn.mock.calls.filter(
            ([message]) => !String(message).includes('Duplicate named routes definition'),
        );
        expect(unexpected).toEqual([]);
        expect(console.error).not.toHaveBeenCalled();
        jest.restoreAllMocks();
        fetchSources.mockReset();
        fetchHeadlines.mockReset();
    });

    it('renders the news sources and passes the state on', async () => {
        const { context, html, title } = await render('/news/');

        expect(fetchSources).toHaveBeenCalledTimes(1);
        expect(context.statusCode).toBe(200);
        expect(context.state.sources).toEqual({ sources: SOURCES });
        expect(html).toContain('data-server-rendered="true"');
        expect(html).toContain('Pick a news source');
        expect(html).toContain('ABC News');
        expect(html).toContain('href="/news/article/bbc-sport"');
        expect(title).toContain('Headline News');
    });

    it('renders the headlines of the source in the url', async () => {
        const { context, html, title } = await render('/news/article/abc-news');

        expect(fetchHeadlines).toHaveBeenCalledWith('abc-news');
        expect(context.statusCode).toBe(200);
        expect(context.state.news).toEqual({ 'abc-news': { status: 'ok', articles: ARTICLES } });
        expect(html).toContain('First headline');
        expect(html).toContain('src="https://news.example/second.jpg"');
        expect(title).toContain('Articles - Headline News');
    });

    it('supports a language prefix', async () => {
        const { context, html } = await render('/ua/news/');

        expect(context.statusCode).toBe(200);
        expect(html).toContain('BBC Sport');
    });

    it('renders the 404 page without state for unknown routes', async () => {
        const { context, html, title } = await render('/news/nonExisting');

        expect(context.statusCode).toBe(404);
        expect(context.state).toBeUndefined();
        expect(html).toContain('404 not found component');
        expect(title).toContain('News - Not found');
        expect(fetchSources).not.toHaveBeenCalled();
    });

    it.each([
        ['an error with code 404', Object.assign(new Error('Not found'), { code: 404 })],
        ['a 404 response', httpError(404)],
        ['a 400 response', httpError(400)],
    ])('renders the 404 page when the news API answers with %s', async (_, error) => {
        fetchHeadlines.mockRejectedValue(error);

        const { context, html } = await render('/news/article/unknown');

        expect(context.statusCode).toBe(404);
        expect(context.state).toBeUndefined();
        expect(html).toContain('404 not found component');
        expect(console.log).toHaveBeenCalledWith('Not found error from API caught! Re-rendering app...');
    });

    it.each([
        ['a 500 response', httpError(500)],
        ['a network error', new Error('Network Error')],
    ])('fails with status 500 when the news API answers with %s', async (_, error) => {
        fetchHeadlines.mockRejectedValue(error);
        const context = { url: '/news/article/abc-news', appId: 'news__at__main' };

        await expect(createApp(context)).rejects.toBe(error);
        expect(context.statusCode).toBe(500);
    });
});
