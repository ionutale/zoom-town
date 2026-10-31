export const COLORS = {
	sky: 0x7ec8f2,
	skyTop: 0x4fb3e8,
	cream: 0xfff6e3,
	cream2: 0xffe9bd,
	grass: 0x7cc242,
	grass2: 0x4e8f2a,
	road: 0x6b6f76,
	road2: 0x555a62,
	ink: 0x26313c,
	inkSoft: 0x5b6b78,
	red: 0xe8433f,
	yellow: 0xf7c948,
	gold: 0xffc93c,
	blue: 0x3b82d6,
	pink: 0xf06e9c,
	orange: 0xf28c28,
	teal: 0x2fb8a6,
	water: 0x59c3e8,
	wood: 0xb9773f,
	white: 0xffffff
} as const;

export const CAR_COLORS: Record<string, number> = {
	bear: COLORS.blue,
	bunny: COLORS.pink,
	fox: COLORS.orange,
	cat: COLORS.teal
};

export function cssColor(hex: number): string {
	return `#${hex.toString(16).padStart(6, '0')}`;
}
