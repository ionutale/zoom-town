/**
 * Desktop driving controls.
 *
 * The game is designed for a phone, but the desktop build is used for
 * development and by parents on a laptop, so the arrow keys (or WASD) drive and
 * Space boosts. The handlers are on `window` and ignore modifier keys and text
 * fields, so they cannot swallow browser shortcuts or form input.
 */
export interface DrivingKeysOptions {
	onSteer: (value: number) => void;
	onBoost: () => void;
	/** P toggles between pause and resume. */
	onTogglePause: () => void;
	/** Escape pauses when a race is running. */
	onEscape: () => void;
}

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const BOOST = new Set(['Space', 'ArrowUp', 'KeyW']);

function isTextTarget(target: EventTarget | null): boolean {
	const element = target as HTMLElement | null;
	if (!element) return false;
	return (
		element.tagName === 'INPUT' ||
		element.tagName === 'TEXTAREA' ||
		element.tagName === 'SELECT' ||
		element.isContentEditable === true
	);
}

/** Space belongs to a focused button; it must not double as the boost key. */
function isActivatable(target: EventTarget | null): boolean {
	const element = target as HTMLElement | null;
	if (!element) return false;
	return (
		element.tagName === 'BUTTON' ||
		element.tagName === 'A' ||
		element.getAttribute('role') === 'button'
	);
}

export function bindDrivingKeys(options: DrivingKeysOptions): () => void {
	let left = false;
	let right = false;
	const emitSteer = () => options.onSteer((right ? 1 : 0) - (left ? 1 : 0));

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTextTarget(event.target)) return;

		if (LEFT.has(event.code)) {
			event.preventDefault();
			left = true;
			emitSteer();
			return;
		}
		if (RIGHT.has(event.code)) {
			event.preventDefault();
			right = true;
			emitSteer();
			return;
		}
		if (BOOST.has(event.code)) {
			if (event.code === 'Space' && isActivatable(event.target)) return;
			event.preventDefault();
			// Holding the key must not drain every charge in one press.
			if (!event.repeat) options.onBoost();
			return;
		}
		if (event.code === 'KeyP') {
			event.preventDefault();
			options.onTogglePause();
			return;
		}
		if (event.code === 'Escape') {
			options.onEscape();
		}
	};

	const onKeyUp = (event: KeyboardEvent) => {
		if (LEFT.has(event.code)) left = false;
		else if (RIGHT.has(event.code)) right = false;
		else return;
		emitSteer();
	};

	const release = () => {
		left = false;
		right = false;
		options.onSteer(0);
	};

	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	window.addEventListener('blur', release);

	return () => {
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);
		window.removeEventListener('blur', release);
	};
}
