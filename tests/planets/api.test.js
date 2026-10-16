import fetchWithCache from '@portal/fetchWithCache';
import { getPerson, getPlanet, getPlanets } from '../../apps/planets/src/utils/api';

jest.mock('@portal/fetchWithCache', () => jest.fn(() => 'observable'));

describe('planets: api', () => {
    it('requests a page of planets, the first one by default', () => {
        expect(getPlanets()).toBe('observable');
        expect(getPlanets(3)).toBe('observable');
        expect(fetchWithCache.mock.calls).toEqual([['planets/?page=1'], ['planets/?page=3']]);
    });

    it('requests a planet by id', () => {
        expect(getPlanet(7)).toBe('observable');
        expect(fetchWithCache).toHaveBeenLastCalledWith('planets/7');
    });

    it('requests a person by number', () => {
        expect(getPerson('12')).toBe('observable');
        expect(fetchWithCache).toHaveBeenLastCalledWith('people/12/');
    });
});
