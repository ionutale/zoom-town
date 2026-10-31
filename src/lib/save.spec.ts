import { describe, expect, it } from 'vitest';
import { createProfile, defaultSave, recordResult, resetProfile, syncProfile } from './save';

describe('save data', () => {
	it('starts with three empty profile slots', () => {
		expect(defaultSave().profiles).toEqual([null, null, null]);
		expect(defaultSave().settings).toEqual({ sound: true, lang: 'it', reducedMotion: false });
	});

	it('creates a profile with Bear available', () => {
		const profile = createProfile(0, 'star');
		expect(profile.bestStars).toBe(0);
		expect(profile.unlocked).toEqual(['bear']);
		expect(profile.selectedCar).toBe('bear');
	});

	it('syncs unlocks to the best star count', () => {
		const profile = syncProfile({ ...createProfile(0, 'flower'), bestStars: 2 });
		expect(profile.unlocked).toEqual(['bear', 'bunny', 'fox']);
	});

	it('records a three-star race and unlocks the garage', () => {
		const save = defaultSave();
		save.profiles[0] = createProfile(0, 'moon');
		const result = recordResult(save, 0, 3, 'bear');
		expect(result.save.profiles[0]?.bestStars).toBe(3);
		expect(result.save.profiles[0]?.unlocked).toEqual(['bear', 'bunny', 'fox', 'cat']);
		expect(result.newCar).toBe('bunny');
		expect(result.trophy).toBe(true);
		expect(result.save.profiles[0]?.trophySeen).toBe(true);
	});

	it('never lowers the best result', () => {
		const save = defaultSave();
		save.profiles[0] = createProfile(0, 'star');
		const first = recordResult(save, 0, 3, 'bear');
		const second = recordResult(first.save, 0, 1, 'bear');
		expect(second.save.profiles[0]?.bestStars).toBe(3);
		expect(second.newCar).toBeNull();
		expect(second.trophy).toBe(false);
	});

	it('resets only the chosen profile', () => {
		const save = defaultSave();
		save.profiles[0] = createProfile(0, 'star');
		save.profiles[1] = createProfile(1, 'moon');
		const reset = resetProfile(save, 0);
		expect(reset.profiles[0]).toBeNull();
		expect(reset.profiles[1]).not.toBeNull();
	});
});
