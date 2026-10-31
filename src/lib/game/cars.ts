export type CarId = 'bear' | 'bunny' | 'fox' | 'cat';
export type AvatarId = 'star' | 'flower' | 'moon';
export type EarShape = 'round' | 'long' | 'pointed' | 'triangle';

export interface CarSpec {
	id: CarId;
	name: string;
	driver: string;
	color: string;
	dark: string;
	fur: string;
	furDark: string;
	ears: EarShape;
	tail: boolean;
	unlockedAt: number;
}

export const CARS: readonly CarSpec[] = [
	{
		id: 'bear',
		name: 'Bear',
		driver: 'Bear',
		color: '#3B82D6',
		dark: '#2C63A5',
		fur: '#9A6636',
		furDark: '#734A25',
		ears: 'round',
		tail: false,
		unlockedAt: 0
	},
	{
		id: 'bunny',
		name: 'Bunny',
		driver: 'Bunny',
		color: '#F06E9C',
		dark: '#C44E78',
		fur: '#FFF1E2',
		furDark: '#D9BFAE',
		ears: 'long',
		tail: true,
		unlockedAt: 1
	},
	{
		id: 'fox',
		name: 'Fox',
		driver: 'Fox',
		color: '#F28C28',
		dark: '#C46A16',
		fur: '#E8791E',
		furDark: '#B85A12',
		ears: 'pointed',
		tail: true,
		unlockedAt: 2
	},
	{
		id: 'cat',
		name: 'Cat',
		driver: 'Cat',
		color: '#2FB8A6',
		dark: '#228C7E',
		fur: '#8B6B4A',
		furDark: '#654B32',
		ears: 'triangle',
		tail: true,
		unlockedAt: 3
	}
] as const;

export const CAR_BY_ID = Object.fromEntries(CARS.map((car) => [car.id, car])) as Record<
	CarId,
	CarSpec
>;

export const AVATARS: readonly { id: AvatarId; color: string; label: string }[] = [
	{ id: 'star', color: '#F7C948', label: 'Star' },
	{ id: 'flower', color: '#F06E9C', label: 'Flower' },
	{ id: 'moon', color: '#3B82D6', label: 'Moon' }
] as const;

export function carsForStars(stars: number): CarId[] {
	return CARS.filter((car) => stars >= car.unlockedAt).map((car) => car.id);
}

export function isCarUnlocked(car: CarSpec, stars: number): boolean {
	return stars >= car.unlockedAt;
}
