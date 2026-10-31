import { describe, expect, it } from 'vitest';
import { isIosDevice, isIosSafari } from './pwa';

describe('iOS PWA detection', () => {
	it('detects iPhone and iPad user agents', () => {
		expect(
			isIosDevice(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
			)
		).toBe(true);
		expect(
			isIosDevice(
				'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
			)
		).toBe(true);
	});

	it('detects iPadOS desktop-mode user agents', () => {
		expect(
			isIosDevice(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
				'MacIntel',
				5
			)
		).toBe(true);
	});

	it('does not treat Android or desktop as iOS', () => {
		expect(isIosDevice('Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36')).toBe(
			false
		);
		expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15')).toBe(false);
	});

	it('only uses Safari for the install instructions', () => {
		expect(
			isIosSafari(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
			)
		).toBe(true);
		expect(
			isIosSafari(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1'
			)
		).toBe(false);
	});
});
