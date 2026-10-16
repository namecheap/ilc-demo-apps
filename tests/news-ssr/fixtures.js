// Responses of the news API (https://swapi-e2e.service.spaceship.com/api/v1/sample-ilc-demo-app) used by the tests
export const SOURCES = [
    {
        id: 'abc-news',
        name: 'ABC News',
        description: 'Your trusted source for breaking news.',
        category: 'general',
        language: 'en',
    },
    {
        id: 'bbc-sport',
        name: 'BBC Sport',
        description: 'The home of BBC Sport online.',
        category: 'sports',
        language: 'en',
    },
];

export const ARTICLES = [
    {
        title: 'First headline',
        description: 'What happened first.',
        url: 'https://news.example/first',
        urlToImage: 'https://news.example/first.jpg',
    },
    {
        title: 'Second headline',
        description: 'What happened next.',
        url: 'https://news.example/second',
        urlToImage: 'https://news.example/second.jpg',
    },
];

// axios rejects with errors like these for non-2xx responses
export function httpError(status) {
    return Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });
}
