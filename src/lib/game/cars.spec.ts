import { describe, expect, it } from 'vitest';
import { AVATARS, CARS, carsForStars } from './cars';

describe('cars and unlocks', () => {
	it('starts with Bear only', () => {
		expect(carsForStars(0)).toEqual(['bear']);
	});

	it('unlocks one car per star', () => {
		expect(carsForStars(1)).toEqual(['bear', 'bunny']);
		expect(carsForStars(2)).toEqual(['bear', 'bunny', 'fox']);
		expect(carsForStars(3)).toEqual(['bear', 'bunny', 'fox', 'cat']);
	});

	it('never locks a car that is already available', () => {
		for (const car of CARS) {
			expect(carsForStars(car.unlockedAt)).toContain(car.id);
			expect(carsForStars(3)).toContain(car.id);
		}
	});

	it('has three profile avatars', () => {
		expect(AVATARS.map((avatar) => avatar.id)).toEqual(['star', 'flower', 'moon']);
	});
});
