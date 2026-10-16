import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import { act } from 'react-dom/test-utils';
import RootComponent from '../../apps/wrapper/src/root.component';
import serverEntry from '../../apps/wrapper/src/server-entry';
import * as lifecycles from '../../apps/wrapper/src/client-entry';

let container;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    window.history.replaceState({}, '', '/');
});

const render = (element) => act(() => {
    ReactDOM.render(element, container);
});

describe('wrapper root component', () => {
    test('offers to mount the wrapped app', () => {
        const renderApp = jest.fn();
        render(<RootComponent renderApp={renderApp} />);

        expect(container.querySelector('.rootWrapper h1').textContent).toBe('Hello from wrapper!');
        expect(renderApp).not.toHaveBeenCalled();
    });

    test('renders the wrapped app with extra props on click, remembering it in the URL', () => {
        window.history.replaceState({}, '', '/wrapper/?a=b');
        const renderApp = jest.fn();
        render(<RootComponent renderApp={renderApp} />);

        act(() => {
            container.querySelector('button').click();
        });

        expect(renderApp).toHaveBeenCalledWith({ propFromWrapper: 'AAAAA', fromClick: 1 });
        expect(window.location.pathname).toBe('/wrapper/');
        expect(window.location.search).toBe('?a=b&showApp=1');
    });

    test('renders the wrapped app straight away when the URL asks for it', () => {
        window.history.replaceState({}, '', '/wrapper/?showApp=1');
        const renderApp = jest.fn();
        render(<RootComponent renderApp={renderApp} />);

        expect(renderApp).toHaveBeenCalledWith({ propFromWrapper: 'AAAAA', fromLocation: 1 });
        expect(container.innerHTML).toBe('');
    });

    test('works without a renderApp callback', () => {
        window.history.replaceState({}, '', '/wrapper/?showApp=1');
        render(<RootComponent />);

        expect(container.innerHTML).toBe('');
    });

    test('uses the location given by the server instead of the window one', () => {
        const renderApp = jest.fn();
        const html = ReactDOMServer.renderToString(
            serverEntry({ renderApp, serverLocation: new URL('https://demo.example/wrapper/?showApp=1') }),
        );

        expect(html).toBe('');
        expect(renderApp).toHaveBeenCalledWith({ propFromWrapper: 'AAAAA', fromLocation: 1 });

        expect(
            ReactDOMServer.renderToString(serverEntry({ serverLocation: new URL('https://demo.example/wrapper/') })),
        ).toContain('Hello from wrapper!');
    });
});

describe('wrapper client entry', () => {
    test('hydrates the server-rendered wrapper and logs every lifecycle call', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});
        // function components get a hint to add an error boundary
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const consoleError = jest.spyOn(console, 'error');
        try {
            container.innerHTML = ReactDOMServer.renderToString(
                serverEntry({ serverLocation: new URL('https://demo.example/wrapper/') }),
            );
            const ssrButton = container.querySelector('button');
            const props = { name: '@portal/wrapper', domElementGetter: () => container };

            await lifecycles.bootstrap(props);
            await act(() => lifecycles.mount(props));

            // hydrated: the server markup is kept and becomes interactive
            expect(container.querySelector('button')).toBe(ssrButton);
            expect(consoleError).not.toHaveBeenCalled();
            act(() => {
                ssrButton.click();
            });
            expect(window.location.search).toBe('?showApp=1');

            await act(() => lifecycles.unmount(props));
            expect(container.innerHTML).toBe('');

            expect(log.mock.calls).toEqual([
                ['wrapper "bootstrap" called with props', props],
                ['wrapper "mount" called with props', props],
                ['wrapper "unmount" called with props', props],
            ]);
        } finally {
            log.mockRestore();
            warn.mockRestore();
            consoleError.mockRestore();
        }
    });
});
