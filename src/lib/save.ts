import { AVATARS, CARS, carsForStars, type AvatarId, type CarId } from './game/cars';
import { DEFAULT_TRACK_ID, TRACK_DEFS, type TrackId } from './game/track';

export type Lang = 'it' | 'en';

export interface ProfileData {
	avatar: AvatarId;
	bestStars: number;
	unlocked: CarId[];
	selectedCar: CarId;
	selectedTrack: TrackId;
	tutorialSeen: boolean;
	trophySeen: boolean;
}

export interface Settings {
	sound: boolean;
	lang: Lang;
	reducedMotion: boolean;
	advancedDriving: boolean;
}

export interface SaveData {
	version: 1;
	profiles: (ProfileData | null)[];
	settings: Settings;
}

const KEY = 'zoomtown.save.v1';

export function defaultSave(): SaveData {
	return {
		version: 1,
		profiles: [null, null, null],
		settings: { sound: true, lang: 'it', reducedMotion: false, advancedDriving: false }
	};
}

export function loadSave(): SaveData {
	if (typeof localStorage === 'undefined') return defaultSave();
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return defaultSave();
		const parsed = JSON.parse(raw) as Partial<SaveData>;
		if (parsed.version !== 1 || !Array.isArray(parsed.profiles)) return defaultSave();
		const profiles = Array.from({ length: 3 }, (_, i) => {
			const p = parsed.profiles?.[i];
			if (!p || typeof p !== 'object') return null;
			const avatar = AVATARS.some((a) => a.id === p.avatar) ? p.avatar : 'star';
			const bestStars = Math.max(0, Math.min(3, Number(p.bestStars) || 0));
			const unlocked = carsForStars(bestStars);
			const selectedCar = unlocked.includes(p.selectedCar as CarId)
				? (p.selectedCar as CarId)
				: 'bear';
			const selectedTrack = TRACK_DEFS.some((track) => track.id === p.selectedTrack)
				? (p.selectedTrack as TrackId)
				: DEFAULT_TRACK_ID;
			return {
				avatar: avatar as AvatarId,
				bestStars,
				unlocked,
				selectedCar,
				selectedTrack,
				tutorialSeen: Boolean(p.tutorialSeen),
				trophySeen: Boolean(p.trophySeen)
			};
		});
		return {
			version: 1,
			profiles,
			settings: {
				sound: parsed.settings?.sound !== false,
				lang: parsed.settings?.lang === 'en' ? 'en' : 'it',
				reducedMotion: Boolean(parsed.settings?.reducedMotion),
				advancedDriving: parsed.settings?.advancedDriving === true
			}
		};
	} catch {
		return defaultSave();
	}
}

export function storeSave(data: SaveData): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {
		// Storage can be full or disabled; the game still works for this session.
	}
}

export function createProfile(slot: number, avatar: AvatarId): ProfileData {
	return {
		avatar,
		bestStars: 0,
		unlocked: carsForStars(0),
		selectedCar: 'bear',
		selectedTrack: DEFAULT_TRACK_ID,
		tutorialSeen: false,
		trophySeen: false
	};
}

export function syncProfile(profile: ProfileData): ProfileData {
	return {
		...profile,
		unlocked: carsForStars(profile.bestStars),
		selectedCar: carsForStars(profile.bestStars).includes(profile.selectedCar)
			? profile.selectedCar
			: 'bear'
	};
}

export function recordResult(
	data: SaveData,
	slot: number,
	stars: number,
	selectedCar: CarId
): { save: SaveData; newCar: CarId | null; trophy: boolean } {
	const profile = data.profiles[slot];
	if (!profile) return { save: data, newCar: null, trophy: false };
	const previousUnlocked = new Set(profile.unlocked);
	const bestStars = Math.max(profile.bestStars, stars);
	const updated = syncProfile({
		...profile,
		bestStars,
		selectedCar,
		tutorialSeen: true
	});
	const unlockedNow = updated.unlocked.filter((id) => !previousUnlocked.has(id));
	const newCar = unlockedNow.length > 0 ? unlockedNow[0] : null;
	const allCars = CARS.every((car) => updated.unlocked.includes(car.id));
	const trophy = allCars && bestStars >= 3 && !profile.trophySeen;
	if (trophy) updated.trophySeen = true;
	const profiles = [...data.profiles];
	profiles[slot] = updated;
	return { save: { ...data, profiles }, newCar, trophy };
}

export function resetProfile(data: SaveData, slot: number): SaveData {
	const profiles = [...data.profiles];
	profiles[slot] = null;
	return { ...data, profiles };
}

export function starsFor(profile: ProfileData | null): number {
	return profile?.bestStars ?? 0;
}
