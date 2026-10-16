// Fake SWAPI responses for the people app. Tests mock `@portal/fetchWithCache` with `swapi`, which answers only
// when the test calls `flush()`, so loading states can be observed however slow the machine is (a timer could
// fire while React's async act() yields to the event loop).
import { defer, throwError } from 'rxjs';
import { act } from 'react-dom/test-utils';

const API = 'https://swapi-e2e.service.spaceship.com/api/v1/sample-ilc-demo-app/';

export const luke = {
    id: '1',
    name: 'Luke Skywalker',
    height: '172',
    mass: '77',
    hair_color: 'blond',
    gender: 'male',
    birth_year: '19BBY',
    homeworld: `${API}planets/1/`,
    films: [`${API}films/1/`, `${API}films/2/`],
};
export const c3po = {
    ...luke,
    id: '2',
    name: 'C-3PO',
    height: '167',
    hair_color: 'n/a',
    gender: 'n/a',
    homeworld: `${API}planets/1/`,
    films: [`${API}films/1/`],
};
export const r2d2 = { ...c3po, id: '3', name: 'R2-D2', height: '96', homeworld: `${API}planets/8/` };

// a person whose homeworld and films cannot be loaded
export const unknown = { ...c3po, id: '4', name: 'Unknown', homeworld: `${API}planets/404/`, films: [`${API}films/404/`] };

export const tatooine = { id: '1', name: 'Tatooine' };
export const naboo = { id: '8', name: 'Naboo' };

export const newHope = {
    episode_id: 4,
    title: 'A New Hope',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    release_date: '1977-05-25',
};
export const empire = {
    episode_id: 5,
    title: 'The Empire Strikes Back',
    director: 'Irvin Kershner',
    producer: 'Gary Kurtz, Rick McCallum',
    release_date: '1980-05-17',
};

export const responses = {
    'people/?page=1': { next: `${API}people/?page=2`, results: [luke, c3po] },
    'people/?page=2': { next: null, results: [r2d2] },
    'people/1/': luke,
    'people/3/': r2d2,
    'people/4/': unknown,
    'planets/1/': tatooine,
    'planets/8/': naboo,
    'films/1/': newHope,
    'films/2/': empire,
};

const pendingResponses = [];

afterEach(() => {
    pendingResponses.length = 0;
});

export function swapi(path) {
    if (!(path in responses)) {
        return throwError(new Error(`Request failed: ${path}`));
    }
    return defer(() => new Promise((resolve) => pendingResponses.push(() => resolve(responses[path]))));
}

// Answers the pending requests and lets every timer, follow-up request and re-render settle (async-decorator
// also emits props on a timer)
export async function flush() {
    for (let i = 0; i < 10; i++) {
        await act(async () => {
            pendingResponses.splice(0).forEach((respond) => respond());
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
    }
}

// The element's text with a space between the text of adjacent elements
export function text(element) {
    const parts = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        parts.push(walker.currentNode.nodeValue);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}
