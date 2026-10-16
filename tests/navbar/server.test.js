/**
 * @jest-environment node
 */
import request from 'supertest';
import { loadServer, ilcRequest } from '../helpers/ilc';
import enLinks from '../../apps/navbar/src/links/en-US.json';
import uaLinks from '../../apps/navbar/src/links/ua-UA.json';

// The links the client side picks up from the server response (see root.component.js)
const messagesOf = (html) => JSON.parse(html.match(/^<script type="application\/messages">(.*?)<\/script>/)[1]);
const anchors = (html) => html.match(/<a [^>]*>/g);

describe('navbar server', () => {
    let navbar;

    beforeAll(() => {
        navbar = loadServer('navbar');
    });

    const render = (options) => {
        const { query, headers } = ilcRequest({ appId: 'navbar', ...options });
        return request(navbar.server).get(`/?${query}`).set(headers);
    };

    test('listens on the port from PORT.json', () => {
        expect(navbar.port).toBe(8235);
        expect(navbar.logs).toEqual(['Navbar server started at port 8235']);
    });

    test('renders the links of the current locale and highlights the current page', async () => {
        const res = await render({ uri: '/planets/tatooine', intl: { locale: 'en-US' } });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/^text\/html/);
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(messagesOf(res.text)).toEqual(enLinks);
        expect(res.text).toContain('<div class="app-container"><div class="navbar-app">');
        for (const { name } of enLinks) {
            expect(res.text).toContain(`>${name}</a>`);
        }

        const planets = anchors(res.text).find((a) => a.includes('href="/planets"'));
        const people = anchors(res.text).find((a) => a.includes('href="/people"'));
        expect(planets).toContain('style="color:red"');
        expect(people).not.toContain('style=');
    });

    test('localizes links for a non-default locale', async () => {
        const res = await render({ uri: '/ua-UA/people', intl: { locale: 'ua-UA' } });

        expect(res.status).toBe(200);
        expect(messagesOf(res.text)).toEqual(uaLinks);
        for (const { name } of uaLinks) {
            expect(res.text).toContain(`>${name}</a>`);
        }
        expect(anchors(res.text).filter((a) => a.includes('primary-navigation-link'))).toHaveLength(uaLinks.length);
        expect(anchors(res.text).some((a) => /href="\/ua[^"]*\/people"/.test(a))).toBe(true);
    });

    test('falls back to the default locale when there are no links for the current one', async () => {
        const res = await render({ uri: '/', intl: { locale: 'fr-FR', supported: ['en-US', 'ua-UA', 'fr-FR'] } });

        expect(res.status).toBe(200);
        expect(messagesOf(res.text)).toEqual(enLinks);
    });

    test('uses the default locale when ILC sends no intl data', async () => {
        const res = await render({ uri: '/' });

        expect(res.status).toBe(200);
        expect(messagesOf(res.text)).toEqual(enLinks);
    });

    test('serves the bundle through webpack dev middleware in development', async () => {
        const dev = loadServer('navbar', { development: true });

        expect(dev.webpack).toHaveBeenCalledWith(dev.webpackConfig);
        expect(dev.devMiddleware).toHaveBeenCalledWith(
            dev.compiler,
            expect.objectContaining({ headers: { 'Access-Control-Allow-Origin': '*' } }),
        );

        const { query, headers } = ilcRequest({ appId: 'navbar', intl: { locale: 'en-US' } });
        const res = await request(dev.server).get(`/?${query}`).set(headers);
        expect(res.status).toBe(200);
        expect(messagesOf(res.text)).toEqual(enLinks);
    });
});
