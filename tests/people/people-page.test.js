// PeoplePage and PeopleList methods that no UI element of the app reaches
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { NEVER } from 'rxjs';
import fetchWithCache from '@portal/fetchWithCache';
// the router the app is built with
import { MemoryRouter, Route } from '../../apps/people/node_modules/react-router';
import PeoplePage from '../../apps/people/src/people-page/people-page.component';
import PeopleList from '../../apps/people/src/people-list/people-list.component';
import { swapi, flush, text, luke, c3po } from './swapi';

jest.mock('@portal/fetchWithCache', () => ({ __esModule: true, default: jest.fn() }));

let container;

function render(element) {
    act(() => {
        ReactDOM.render(<MemoryRouter>{element}</MemoryRouter>, container);
    });
}

// the PeoplePage instance (AsyncDecorator keeps it as `el`)
function renderPeoplePage() {
    const decorator = React.createRef();
    render(<Route path="/" render={(props) => <PeoplePage {...props} ref={decorator} />} />);
    return decorator.current.el;
}

const requested = () => fetchWithCache.mock.calls.map(([path]) => path);

beforeEach(() => {
    fetchWithCache.mockReset();
    fetchWithCache.mockImplementation(swapi);
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
});

describe('PeoplePage', () => {
    test('selectPerson selects the person at a list index and ignores a missing index', async () => {
        const page = renderPeoplePage();
        await flush();
        expect(text(container)).toContain('No one selected');

        act(() => page.selectPerson(1));
        expect(text(container.querySelector('.selectedPerson'))).toContain('Name C-3PO');

        act(() => page.selectPerson(undefined));
        expect(text(container.querySelector('.selectedPerson'))).toContain('Name C-3PO');
        await flush();
    });

    test('fetchPeople requests the first page by default', () => {
        fetchWithCache.mockImplementation(() => NEVER);
        const page = renderPeoplePage();

        act(() => page.fetchPeople());
        expect(requested()).toEqual(['people/?page=1', 'people/?page=1']);
    });

    test('nothing more is requested once the last page is loaded', async () => {
        const page = renderPeoplePage();
        await flush();
        act(() => page.fetchMore());
        await flush();
        expect(requested()).toEqual(['people/?page=1', 'people/?page=2']);

        act(() => {
            page.fetchMore();
            page.fetchPeople(3);
        });
        expect(requested()).toEqual(['people/?page=1', 'people/?page=2']);
    });
});

describe('PeopleList', () => {
    // the PeopleList instance (react-router 4 takes a callback ref only)
    function renderPeopleList(props) {
        let list;
        const ref = (instance) => {
            list = instance;
        };
        render(<PeopleList wrappedComponentRef={ref} people={[luke, c3po]} {...props} />);
        return list;
    }

    test('links every person to their selection and shows that more are loading', () => {
        renderPeopleList({ loadingPeople: true, people: [luke, { ...c3po, id: 'C-3PO/2' }] });

        const links = [...container.querySelectorAll('a')];
        expect(links.map(text)).toEqual(['Luke Skywalker', 'C-3PO']);
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['/?selected=1', '/?selected=C-3PO%2F2']);
        expect(text(container)).toContain('Loading ...');
    });

    test('onKeyPress selects the person on Enter and Space only', () => {
        const selectPerson = jest.fn();
        const list = renderPeopleList({ loadingPeople: false, selectPerson });
        expect(text(container)).not.toContain('Loading');

        list.onKeyPress({ key: 'Enter' }, 0);
        list.onKeyPress({ key: ' ' }, 1);
        list.onKeyPress({ key: 'a' }, 1);
        expect(selectPerson.mock.calls).toEqual([[0], [1]]);
    });
});
