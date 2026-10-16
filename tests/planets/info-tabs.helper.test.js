import { abbrNum } from '../../apps/planets/src/selected-planet/info-tabs/info-tabs.helper';

describe('planets: abbrNum', () => {
    it('leaves numbers below a thousand as they are', () => {
        expect(abbrNum(0)).toBe(0);
        expect(abbrNum(999)).toBe(999);
    });

    it('abbreviates thousands, millions, billions and trillions to 2 decimal places', () => {
        expect(abbrNum(1000)).toBe('1k');
        expect(abbrNum(1234)).toBe('1.23k');
        expect(abbrNum(200000)).toBe('200k');
        expect(abbrNum(4500000)).toBe('4.5m');
        expect(abbrNum(1000000000)).toBe('1b');
        expect(abbrNum(2000000000000)).toBe('2t');
    });

    it('takes the number of decimal places', () => {
        expect(abbrNum(1234, 0)).toBe('1k');
        expect(abbrNum(1234, 3)).toBe('1.234k');
    });

    it('moves to the next abbreviation when rounding reaches a thousand', () => {
        expect(abbrNum(999999)).toBe('1m');
        expect(abbrNum(999999999)).toBe('1b');
    });

    it('keeps counting in trillions past a thousand of them', () => {
        expect(abbrNum(999999999999999)).toBe('1000t');
        expect(abbrNum(5000000000000000)).toBe('5000t');
    });
});
