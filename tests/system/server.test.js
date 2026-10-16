/**
 * @jest-environment node
 */
import request from 'supertest';
import { loadServer, ilcRequest } from '../helpers/ilc';

describe('system server', () => {
    let system;

    beforeAll(() => {
        system = loadServer('system');
    });

    const fragment = (appProps, server = system.server) => {
        const { query, headers } = ilcRequest({ appId: 'system', uri: '/', appProps });
        return request(server).get(`/fragment?${query}`).set(headers);
    };

    const heading = (html) => html.match(/<h1>(.*?)<\/h1>/)[1];

    test('listens on port 8240', () => {
        expect(system.port).toBe(8240);
        expect(system.logs).toEqual(['System app listening on port 8240!']);
    });

    test('renders the page asked for by ILC, marked as server-rendered', async () => {
        const res = await fragment({ page: 'home' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/^text\/html/);
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(res.text).toMatch(/^<div data-ssr-content="true">\s*<div class="rootSystem">/);
        expect(heading(res.text)).toBe('Hi! Welcome to our Demo website.');
    });

    test.each([
        [{ page: 'hooks' }, 'Welcome to Transition Hooks entry page.'],
        [{ page: 'hooks-protected' }, 'Welcome to Transition Hooks protected page.'],
        [{ _statusCode: '404' }, '404 not found'],
        [{ _statusCode: '404', title: 'No such planet' }, 'No such planet'],
        [{ page: 'unknown' }, 'Unexpected error'],
        [undefined, 'Unexpected error'],
    ])('renders %j as "%s"', async (appProps, title) => {
        const res = await fragment(appProps);

        expect(res.status).toBe(200);
        expect(heading(res.text)).toBe(title);
    });

    test('shows the props a wrapped page received', async () => {
        const res = await fragment({ page: 'wrapped', propFromWrapper: 'AAAAA' });

        expect(heading(res.text)).toBe('Welcome to target app that is hidden under App Wrapper.');
        const props = res.text.match(/<pre>([\s\S]*?)<\/pre>/)[1];
        expect(JSON.parse(props.replace(/&#34;|&quot;/g, '"'))).toEqual({ page: 'wrapped', propFromWrapper: 'AAAAA' });
    });

    test('serves the bundle through webpack dev middleware in development', async () => {
        const dev = loadServer('system', { development: true });

        expect(dev.webpack).toHaveBeenCalledWith(dev.webpackConfig);
        expect(dev.devMiddleware).toHaveBeenCalledWith(
            dev.compiler,
            expect.objectContaining({ headers: { 'Access-Control-Allow-Origin': '*' } }),
        );

        const res = await fragment({ page: 'home' }, dev.server);
        expect(res.status).toBe(200);
        expect(heading(res.text)).toBe('Hi! Welcome to our Demo website.');
    });
});
