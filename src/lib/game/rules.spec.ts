import { describe, expect, it } from 'vitest';
import { starsForBalloons } from './rules';

describe('star rules', () => {
	it('awards one star for finishing with no balloons', () => {
		expect(starsForBalloons(0)).toBe(1);
		expect(starsForBalloons(4)).toBe(1);
	});

	it('awards two stars at half the balloons', () => {
		expect(starsForBalloons(5)).toBe(2);
		expect(starsForBalloons(9)).toBe(2);
	});

	it('awards three stars for every balloon', () => {
		expect(starsForBalloons(10)).toBe(3);
	});
});
