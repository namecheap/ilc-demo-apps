import fetchWithCache from '@portal/fetchWithCache';
import { getFilm, getFilms, getPeople, getPerson, getPlanet } from '../../apps/people/src/utils/api';

jest.mock('@portal/fetchWithCache', () => ({ __esModule: true, default: jest.fn((path) => `response for ${path}`) }));

describe('people API helpers', () => {
    beforeEach(() => fetchWithCache.mockClear());

    test.each([
        ['getPeople', () => getPeople(3), 'people/?page=3'],
        ['getPeople without a page', () => getPeople(), 'people/?page=1'],
        ['getPerson', () => getPerson('14'), 'people/14/'],
        ['getPlanet', () => getPlanet('8'), 'planets/8/'],
        ['getFilm', () => getFilm('2'), 'films/2/'],
        ['getFilms', () => getFilms(), 'films'],
    ])('%s requests the matching SWAPI path through fetchWithCache', (name, call, path) => {
        expect(call()).toBe(`response for ${path}`);
        expect(fetchWithCache).toHaveBeenCalledTimes(1);
        expect(fetchWithCache).toHaveBeenCalledWith(path);
    });
});
