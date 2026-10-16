import lifecycles from '../../apps/system/index';
import singleSpaHtml from '../../apps/system/single-spa-html-tpl';

afterEach(() => {
    document.body.innerHTML = '';
});

const container = (html = '') => {
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
};

describe('system app', () => {
    const props = (page, domElement) => ({
        name: '@portal/system',
        domElement,
        getCurrentPathProps: () => ({ page }),
    });

    test('renders the page from its template on mount and clears it on unmount', async () => {
        const el = container();
        const home = props('home', el);

        await lifecycles.bootstrap(home);
        await lifecycles.mount(home);
        expect(el.querySelector('.rootSystem h1').textContent).toBe('Hi! Welcome to our Demo website.');

        await lifecycles.unmount(home);
        expect(el.innerHTML).toBe('');
    });

    test('keeps server-rendered content', async () => {
        const ssr = '<div data-ssr-content="true"><h1>from server</h1></div>';
        const el = container(ssr);
        const hooks = props('hooks', el);

        await lifecycles.mount(hooks);
        expect(el.innerHTML).toBe(ssr);

        await lifecycles.unmount(hooks);
    });
});

describe('single-spa-html template adapter', () => {
    test.each([
        [undefined, 'single-spa-html must be called with an opts object'],
        [{}, "single-spa-html must be passed a 'template' opt that is a non empty string"],
        [{ template: '   ' }, "single-spa-html must be passed a 'template' opt that is a non empty string"],
        [{ template: 42 }, "single-spa-html must be passed a 'template' opt that is a non empty string"],
        [
            { template: '<p></p>', domElementGetter: 'app' },
            "single-spa-html was given 'opts.domElementGetter', but it isn't a function",
        ],
    ])('rejects options %j', (opts, message) => {
        expect(() => singleSpaHtml(opts)).toThrow(message);
    });

    const app = (opts) => singleSpaHtml({ template: '<p><%= greeting %></p>', ...opts });

    test('bootstraps without doing anything', async () => {
        await expect(app().bootstrap({ name: 'a' })).resolves.toBeUndefined();
        expect(document.body.innerHTML).toBe('');
    });

    test('renders into props.domElement first', async () => {
        const el = container();
        const other = container();

        await app({ domElementGetter: () => other }).mount({
            name: 'a',
            greeting: 'hi',
            domElement: el,
            domElementGetter: () => other,
        });

        expect(el.innerHTML).toBe('<p>hi</p>');
        expect(other.innerHTML).toBe('');
    });

    test('then into the element from props.domElementGetter', async () => {
        const el = container();
        const other = container();

        await app({ domElementGetter: () => other }).mount({ name: 'a', greeting: 'hi', domElementGetter: () => el });

        expect(el.innerHTML).toBe('<p>hi</p>');
        expect(other.innerHTML).toBe('');
    });

    test('then into the element from opts.domElementGetter', async () => {
        const el = container();

        await app({ domElementGetter: () => el }).mount({ name: 'a', greeting: 'hi' });

        expect(el.innerHTML).toBe('<p>hi</p>');
    });

    test('otherwise into a container named after the app, created once', async () => {
        const lifecycle = app();

        await lifecycle.mount({ name: 'a', greeting: 'hi' });
        const el = document.getElementById('single-spa-application:a');
        expect(el.innerHTML).toBe('<p>hi</p>');

        await lifecycle.unmount({ name: 'a' });
        expect(el.innerHTML).toBe('');
        await lifecycle.mount({ name: 'a', greeting: 'again' });
        expect(document.querySelectorAll('[id="single-spa-application:a"]')).toHaveLength(1);
        expect(el.innerHTML).toBe('<p>again</p>');
    });

    test('names the default container after appName when given', async () => {
        await app().mount({ name: 'a', appName: 'b', greeting: 'hi' });

        expect(document.getElementById('single-spa-application:b').innerHTML).toBe('<p>hi</p>');
    });

    test('fails to mount when there is no element to render into', async () => {
        await expect(app({ domElementGetter: () => null }).mount({ name: 'a' })).rejects.toThrow(
            'single-spa-html: domElementGetter did not return a valid dom element',
        );
    });

    test('re-renders content that was not server-rendered', async () => {
        const el = container('<p>stale</p>');

        await app().mount({ name: 'a', greeting: 'fresh', domElement: el });

        expect(el.innerHTML).toBe('<p>fresh</p>');
    });

    test('unmounting an app that is not mounted does nothing', async () => {
        const lifecycle = app();
        const el = container('<p>untouched</p>');

        await lifecycle.mount({ name: 'a', greeting: 'hi', domElement: container() });
        await expect(lifecycle.unmount({ name: 'b' })).resolves.toBeUndefined();

        expect(el.innerHTML).toBe('<p>untouched</p>');
    });
});
