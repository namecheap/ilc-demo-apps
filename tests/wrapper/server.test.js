/**
 * @jest-environment node
 */
import request from 'supertest';
import { loadServer, ilcRequest } from '../helpers/ilc';

describe('wrapper server', () => {
    let wrapper;

    beforeAll(() => {
        wrapper = loadServer('wrapper');
    });

    const render = (uri, server = wrapper.server) => {
        const { query, headers } = ilcRequest({ appId: 'wrapper', uri, host: 'demo.example' });
        return request(server).get(`/?${query}`).set(headers);
    };

    test('listens on port 8234', () => {
        expect(wrapper.port).toBe(8234);
        expect(wrapper.logs).toEqual(['Navbar server started at port 8234']);
    });

    test('renders the wrapper itself by default', async () => {
        const res = await render('/wrapper/');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/^text\/html/);
        expect(res.headers['access-control-allow-origin']).toBe('*');
        expect(res.headers['x-props-override']).toBeUndefined();
        expect(res.text).toBe(
            '<div class="app-container"><div data-reactroot=""><div class="rootWrapper"><h1>Hello from wrapper!</h1>' +
                '<button>Mount actual app</button></div></div></div>',
        );
    });

    test('forwards the request to the wrapped app with extra props when asked to show it', async () => {
        const res = await render('/wrapper/?showApp=1');

        expect(res.status).toBe(210);
        expect(res.text).toBe('');
        expect(JSON.parse(Buffer.from(res.headers['x-props-override'], 'base64').toString())).toEqual({
            propFromWrapper: 'AAAAA',
            fromLocation: 1,
        });
    });

    test('serves the bundle through webpack dev middleware in development', async () => {
        const dev = loadServer('wrapper', { development: true });

        expect(dev.webpack).toHaveBeenCalledWith(dev.webpackConfig);
        expect(dev.devMiddleware).toHaveBeenCalledWith(
            dev.compiler,
            expect.objectContaining({ publicPath: '/', headers: { 'Access-Control-Allow-Origin': '*' } }),
        );

        const res = await render('/wrapper/', dev.server);
        expect(res.status).toBe(200);
        expect(res.text).toContain('Hello from wrapper!');
    });
});
