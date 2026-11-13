/**
 * Dialog plumbing shared by every overlay: move focus into the panel, keep Tab
 * inside it, close on Escape, and hand focus back to whatever opened it.
 *
 * The overlays are `role="dialog" aria-modal="true"`, so without this a
 * keyboard or screen-reader user could tab into the game behind them.
 */
interface ModalOptions {
	onEscape?: () => void;
}

export function modal(node: HTMLElement, options: ModalOptions = {}) {
	let onEscape = options.onEscape;
	const previouslyFocused = document.activeElement as HTMLElement | null;

	const focusable = (): HTMLElement[] =>
		Array.from(
			node.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		);

	const focusFirst = () => {
		const [first] = focusable();
		(first ?? node).focus();
	};

	// The overlay is only a focus target, never part of the tab order.
	node.tabIndex = -1;
	queueMicrotask(focusFirst);

	const onKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			onEscape?.();
			return;
		}
		if (event.key !== 'Tab') return;
		const items = focusable();
		if (items.length === 0) return;
		const first = items[0];
		const last = items[items.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	window.addEventListener('keydown', onKeydown);

	return {
		update(next: ModalOptions = {}) {
			onEscape = next.onEscape;
		},
		destroy() {
			window.removeEventListener('keydown', onKeydown);
			previouslyFocused?.focus?.();
		}
	};
}
