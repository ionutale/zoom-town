import { beforeEach } from 'vitest';

/**
 * The unit tests run in Node, which has no Web Storage. Save handling needs a
 * real (if in-memory) implementation so the schema and migration code is tested
 * rather than skipped.
 */
function memoryStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear() {
			map.clear();
		},
		getItem(key: string) {
			return map.get(key) ?? null;
		},
		key(index: number) {
			return [...map.keys()][index] ?? null;
		},
		removeItem(key: string) {
			map.delete(key);
		},
		setItem(key: string, value: string) {
			map.set(key, String(value));
		}
	} as Storage;
}

// Node exposes an experimental `localStorage` that warns on access, so inspect
// the property descriptor instead of touching the global.
const existing = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
if (!existing?.value) {
	Object.defineProperty(globalThis, 'localStorage', {
		value: memoryStorage(),
		configurable: true
	});
}

beforeEach(() => {
	localStorage.clear();
});
