import { describe, expect, it } from 'vitest';
import { Balloons } from './balloons';
import { LAPS, TOTAL_BALLOONS } from './rules';
import { getTrack } from './track';

const track = getTrack('park-loop');

describe('balloons', () => {
	it('places five balloons on each of the three laps', () => {
		const balloons = new Balloons(track);
		expect(balloons.items).toHaveLength(TOTAL_BALLOONS);
		expect(balloons.items.filter((item) => item.lap === 1)).toHaveLength(5);
		expect(balloons.items.filter((item) => item.lap === LAPS)).toHaveLength(5);
	});

	it('only shows the current lap', () => {
		const balloons = new Balloons(track);
		expect(balloons.items.every((item) => item.group.visible === (item.lap === 1))).toBe(true);

		balloons.setLap(2);
		expect(balloons.items.every((item) => item.group.visible === (item.lap === 2))).toBe(true);
	});

	it('collects a balloon the car drives through, once', () => {
		const balloons = new Balloons(track);
		const target = balloons.items[0];
		const position = target.group.position.clone();

		const first = balloons.update(1 / 60, position, 1);
		expect(first).toHaveLength(1);
		expect(balloons.collectedTotal).toBe(1);
		expect(target.group.visible).toBe(false);

		const second = balloons.update(1 / 60, position, 1);
		expect(second).toHaveLength(0);
		expect(balloons.collectedTotal).toBe(1);
	});

	it('only collects balloons that belong to the current lap', () => {
		const balloons = new Balloons(track);
		const target = balloons.items.find((item) => item.lap === 2);
		expect(target).toBeDefined();
		// Lap 2 reuses the lap 1 positions, so the same spot is occupied twice.
		const position = target!.group.position.clone();

		const pickups = balloons.update(1 / 60, position, 1);
		expect(target!.collected).toBe(false);
		expect(pickups).toHaveLength(1);
		expect(balloons.items.filter((item) => item.collected && item.lap === 2)).toHaveLength(0);
	});

	it('force-collects an exact whole number of balloons', () => {
		const balloons = new Balloons(track);
		balloons.forceCollect(TOTAL_BALLOONS / 2);
		expect(balloons.collectedTotal).toBe(8);
		expect(balloons.items.filter((item) => item.collected)).toHaveLength(8);
		expect(balloons.items.filter((item) => item.group.visible)).toHaveLength(0);

		balloons.forceCollect(TOTAL_BALLOONS * 2);
		expect(balloons.collectedTotal).toBe(TOTAL_BALLOONS);
	});

	it('resets a completed set', () => {
		const balloons = new Balloons(track);
		balloons.forceCollect(TOTAL_BALLOONS);
		balloons.reset();
		expect(balloons.collectedTotal).toBe(0);
		expect(balloons.items.some((item) => item.collected)).toBe(false);
	});
});
