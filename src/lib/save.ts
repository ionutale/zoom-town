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
export const SAVE_VERSION = 1;

export function defaultSave(): SaveData {
	return {
		version: SAVE_VERSION,
		profiles: [null, null, null],
		settings: { sound: true, lang: 'it', reducedMotion: false, advancedDriving: false }
	};
}

/** Coerces an untrusted stored profile into the current shape, or null. */
function readProfile(value: unknown): ProfileData | null {
	if (!value || typeof value !== 'object') return null;
	const raw = value as Partial<ProfileData>;
	const bestStars = Math.max(0, Math.min(3, Math.trunc(Number(raw.bestStars) || 0)));
	const unlocked = carsForStars(bestStars);
	return {
		avatar: AVATARS.some((avatar) => avatar.id === raw.avatar) ? (raw.avatar as AvatarId) : 'star',
		bestStars,
		unlocked,
		selectedCar: unlocked.includes(raw.selectedCar as CarId) ? (raw.selectedCar as CarId) : 'bear',
		selectedTrack: TRACK_DEFS.some((track) => track.id === raw.selectedTrack)
			? (raw.selectedTrack as TrackId)
			: DEFAULT_TRACK_ID,
		tutorialSeen: Boolean(raw.tutorialSeen),
		trophySeen: Boolean(raw.trophySeen)
	};
}

function readSettings(value: unknown): Settings {
	const raw = (value ?? {}) as Partial<Settings>;
	return {
		sound: raw.sound !== false,
		lang: raw.lang === 'en' ? 'en' : 'it',
		reducedMotion: Boolean(raw.reducedMotion),
		advancedDriving: raw.advancedDriving === true
	};
}

export function loadSave(): SaveData {
	if (typeof localStorage === 'undefined') return defaultSave();
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return defaultSave();
		const parsed = JSON.parse(raw) as {
			version?: number;
			profiles?: unknown;
			settings?: unknown;
		};
		const stored = parsed.profiles;
		if (!Array.isArray(stored)) return defaultSave();
		// v1 and unversioned saves share this shape. A save written by a newer
		// build keeps every field we still understand instead of being wiped:
		// losing a child's unlocked cars is not an acceptable migration cost.
		const profiles = Array.from({ length: 3 }, (_, index) => readProfile(stored[index]));
		return { version: SAVE_VERSION, profiles, settings: readSettings(parsed.settings) };
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

export function createProfile(avatar: AvatarId): ProfileData {
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
