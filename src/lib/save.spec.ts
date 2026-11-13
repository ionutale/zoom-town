import { describe, expect, it } from 'vitest';
import {
	createProfile,
	defaultSave,
	loadSave,
	recordResult,
	resetProfile,
	syncProfile
} from './save';

describe('save data', () => {
	it('starts with three empty profile slots', () => {
		expect(defaultSave().profiles).toEqual([null, null, null]);
		expect(defaultSave().settings).toEqual({
			sound: true,
			lang: 'it',
			reducedMotion: false,
			advancedDriving: false
		});
	});

	it('creates a profile with Bear available', () => {
		const profile = createProfile('star');
		expect(profile.bestStars).toBe(0);
		expect(profile.unlocked).toEqual(['bear']);
		expect(profile.selectedCar).toBe('bear');
		expect(profile.selectedTrack).toBe('sunny-town');
	});

	it('syncs unlocks to the best star count', () => {
		const profile = syncProfile({ ...createProfile('flower'), bestStars: 2 });
		expect(profile.unlocked).toEqual(['bear', 'bunny', 'fox']);
	});

	it('records a three-star race and unlocks the garage', () => {
		const save = defaultSave();
		save.profiles[0] = createProfile('moon');
		const result = recordResult(save, 0, 3, 'bear');
		expect(result.save.profiles[0]?.bestStars).toBe(3);
		expect(result.save.profiles[0]?.unlocked).toEqual(['bear', 'bunny', 'fox', 'cat']);
		expect(result.newCar).toBe('bunny');
		expect(result.trophy).toBe(true);
		expect(result.save.profiles[0]?.trophySeen).toBe(true);
	});

	it('never lowers the best result', () => {
		const save = defaultSave();
		save.profiles[0] = createProfile('star');
		const first = recordResult(save, 0, 3, 'bear');
		const second = recordResult(first.save, 0, 1, 'bear');
		expect(second.save.profiles[0]?.bestStars).toBe(3);
		expect(second.newCar).toBeNull();
		expect(second.trophy).toBe(false);
	});

	it('resets only the chosen profile', () => {
		const save = defaultSave();
		save.profiles[0] = createProfile('star');
		save.profiles[1] = createProfile('moon');
		const reset = resetProfile(save, 0);
		expect(reset.profiles[0]).toBeNull();
		expect(reset.profiles[1]).not.toBeNull();
	});

	describe('loading stored data', () => {
		function store(value: unknown): void {
			localStorage.setItem('zoomtown.save.v1', JSON.stringify(value));
		}

		it('keeps progress from a save written by a newer build', () => {
			store({
				version: 99,
				profiles: [
					{
						avatar: 'flower',
						bestStars: 3,
						unlocked: ['bear', 'bunny', 'fox', 'cat'],
						selectedCar: 'cat',
						selectedTrack: 'candy-hills',
						tutorialSeen: true,
						trophySeen: true,
						future: 'ignored'
					},
					null,
					null
				],
				settings: { sound: false, lang: 'en', reducedMotion: true, advancedDriving: true }
			});
			const save = loadSave();
			expect(save.profiles[0]?.bestStars).toBe(3);
			expect(save.profiles[0]?.unlocked).toEqual(['bear', 'bunny', 'fox', 'cat']);
			expect(save.profiles[0]?.selectedCar).toBe('cat');
			expect(save.settings.lang).toBe('en');
			expect(save.settings.advancedDriving).toBe(true);
		});

		it('accepts an unversioned save', () => {
			store({ profiles: [{ bestStars: 1 }], settings: {} });
			const save = loadSave();
			expect(save.profiles[0]?.bestStars).toBe(1);
			expect(save.profiles[0]?.unlocked).toEqual(['bear', 'bunny']);
		});

		it('degrades a corrupt save to a fresh one', () => {
			store({ profiles: 'not-an-array' });
			expect(loadSave().profiles).toEqual([null, null, null]);
			localStorage.setItem('zoomtown.save.v1', '{oops');
			expect(loadSave().profiles).toEqual([null, null, null]);
		});

		it('clamps nonsense values instead of trusting them', () => {
			store({
				profiles: [{ bestStars: 99, avatar: 'dragon', selectedCar: 'cat', selectedTrack: 'moon' }]
			});
			const profile = loadSave().profiles[0];
			expect(profile?.bestStars).toBe(3);
			expect(profile?.avatar).toBe('star');
			// Cat is unlocked by the clamped 3 stars, so the pick is kept.
			expect(profile?.selectedCar).toBe('cat');
			expect(profile?.selectedTrack).toBe('sunny-town');
		});
	});
});
