import addId from '../../apps/fetchWithCache/src/addId';

describe('fetchWithCache: addId', () => {
    it('takes the last numeric segment of the entity url', () => {
        expect(addId({ url: 'https://swapi.example/api/people/12/' })).toBe('12');
        expect(addId({ url: 'https://swapi.example/api/planets/3' })).toBe('3');
    });

    it('skips segments with a query string and non-numeric segments', () => {
        expect(addId({ url: 'https://swapi.example/api/people/5/?format=json' })).toBe('5');
        expect(addId({ url: 'https://swapi.example/api/people/' })).toBe('unknown');
    });

    it('returns undefined for entities without url', () => {
        expect(addId({ name: 'Luke' })).toBeUndefined();
    });

    it('throws when there is no entity', () => {
        expect(() => addId(undefined)).toThrow('Cannot add an id if entity is not defined');
    });
});
