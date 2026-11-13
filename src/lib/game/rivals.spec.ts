import { describe, expect, it } from 'vitest';
import { PlayerCar, CRUISE_SPEED } from './car';
import { createRivals, Rival } from './rivals';
import { getTrack } from './track';

const track = getTrack('park-loop');

describe('rivals', () => {
	it('races three rivals, never the player car', () => {
		const rivals = createRivals('bear', track);
		expect(rivals).toHaveLength(3);
		expect(rivals.map((rival) => rival.id)).toEqual(['bunny', 'fox', 'cat']);
		expect(createRivals('fox', track).map((rival) => rival.id)).toEqual(['bear', 'bunny', 'cat']);
	});

	it('starts each rival ahead of the line in its own lane', () => {
		const rivals = createRivals('bear', track);
		expect(rivals[0].baseLane).toBeLessThan(0);
		expect(rivals[1].baseLane).toBe(0);
		expect(rivals[2].baseLane).toBeGreaterThan(0);
		expect(new Set(rivals.map((rival) => rival.startGap)).size).toBe(3);
	});

	it('speeds up when it falls behind and eases off when it is far ahead', () => {
		const player = new PlayerCar('bear', track, true);
		const rival = new Rival('bunny', 0, track);

		const baseSpeed = CRUISE_SPEED * rival.speedMul;

		rival.reset();
		// Player far behind the line: the rival is more than 25 m ahead.
		player.raceDistance = -100;
		const startAhead = rival.distance;
		rival.update(1, player);
		expect(rival.distance - startAhead).toBeCloseTo(baseSpeed * 1.08, 5);

		rival.reset();
		// Player far ahead: the rival has to catch up.
		player.raceDistance = 100;
		const startBehind = rival.distance;
		rival.update(1, player);
		expect(rival.distance - startBehind).toBeCloseTo(baseSpeed * 0.92, 5);
	});

	it('never leaves the road when it dodges the player', () => {
		const player = new PlayerCar('bear', track, true);
		const rival = new Rival('fox', 2, track);
		rival.reset();
		player.pos.copy(rival.visual.group.position);

		for (let step = 0; step < 120; step++) {
			rival.update(1 / 60, player);
			expect(Math.abs(rival.lane)).toBeLessThanOrEqual(2.55 + 1e-6);
		}
	});

	it('bumps the player once, then waits for its cooldown', () => {
		const player = new PlayerCar('bear', track, true);
		const rival = new Rival('cat', 1, track);
		rival.reset();

		player.pos.copy(rival.visual.group.position);
		player.pos.x += 0.5;
		const before = player.pos.clone();

		expect(rival.tryBump(player)).toBe(true);
		expect(player.pos.distanceTo(before)).toBeGreaterThan(0);

		expect(rival.tryBump(player)).toBe(false);

		rival.update(0.7, player);
		player.pos.copy(rival.visual.group.position);
		player.pos.x += 0.5;
		expect(rival.tryBump(player)).toBe(true);
	});

	it('a bump cannot push the player through the guardrail', () => {
		const player = new PlayerCar('bear', track, true);
		const sample = track.sampleAt(0.2);
		// Park the car hard against the right-hand rail.
		player.pos.copy(sample.pos).addScaledVector(sample.normal, track.maxLateral);
		player.prevIndex = sample.index;

		player.nudge(sample.normal.x * 5, sample.normal.z * 5);

		const lateral = track.nearestSample(player.pos, sample.index).lateral;
		expect(Math.abs(lateral)).toBeLessThanOrEqual(track.maxLateral + 1e-6);
	});

	it('releases its own GPU buffers without touching the shared wheels', () => {
		const rival = new Rival('fox', 0, track);
		expect(() => rival.dispose()).not.toThrow();
		expect(rival.visual.group.parent).toBeNull();
	});
});
