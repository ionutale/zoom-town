import { describe, expect, it } from 'vitest';
import { LAPS, TOTAL_BALLOONS, starsForBalloons } from './rules';

describe('star rules', () => {
	it('races three laps', () => {
		expect(LAPS).toBe(3);
		expect(TOTAL_BALLOONS).toBe(15);
	});

	it('awards one star for finishing with no balloons', () => {
		expect(starsForBalloons(0)).toBe(1);
		expect(starsForBalloons(4)).toBe(1);
	});

	it('awards two stars at half the balloons', () => {
		expect(starsForBalloons(TOTAL_BALLOONS / 2)).toBe(2);
		expect(starsForBalloons(TOTAL_BALLOONS - 1)).toBe(2);
	});

	it('awards three stars for every balloon', () => {
		expect(starsForBalloons(TOTAL_BALLOONS)).toBe(3);
	});
});
