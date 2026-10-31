export function isIosDevice(
	ua = typeof navigator === 'undefined' ? '' : navigator.userAgent,
	platform = typeof navigator === 'undefined' ? '' : navigator.platform,
	maxTouchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints
): boolean {
	if (/iPad|iPhone|iPod/.test(ua)) return true;
	// iPadOS 13+ reports a Macintosh user agent, but has touch points.
	return platform === 'MacIntel' && maxTouchPoints > 1;
}

export function isIosSafari(
	ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
): boolean {
	if (!isIosDevice(ua)) return false;
	// All iOS browsers use WebKit, but only Safari can install a PWA.
	return !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo)/.test(ua);
}

export function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	const display = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
	const iosStandalone =
		(window.navigator as Navigator & { standalone?: boolean }).standalone === true;
	return display || iosStandalone;
}
