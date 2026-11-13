import { describe, expect, it } from 'vitest';
import { MESSAGES, messages } from './i18n';

describe('messages', () => {
	it('keeps Italian and English in parity', () => {
		const it = Object.keys(MESSAGES.it).sort();
		const en = Object.keys(MESSAGES.en).sort();
		expect(en).toEqual(it);
	});

	it('translates every string that is not shared', () => {
		const it = MESSAGES.it as unknown as Record<string, unknown>;
		const en = MESSAGES.en as unknown as Record<string, unknown>;
		for (const key of Object.keys(it)) {
			const italian = it[key];
			const english = en[key];
			expect(typeof english).toBe(typeof italian);
		}
	});

	it('formats numbers in the reader’s language', () => {
		expect(messages('it').lap(2, 3)).toBe('Giro 2 di 3');
		expect(messages('en').lap(2, 3)).toBe('Lap 2 of 3');
		expect(messages('it').speed(41)).toBe('Velocità 41 chilometri orari');
		expect(messages('en').speed(41)).toBe('Speed 41 kilometres per hour');
	});

	it('falls back to Italian for an unknown language', () => {
		expect(messages('fr' as never).pause).toBe(MESSAGES.it.pause);
	});
});
