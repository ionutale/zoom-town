import { describe, expect, it } from 'vitest';
import { ADVANCED_CRUISE, ADVANCED_TOP, PlayerCar, targetSpeedFor } from './car';
import { LAPS } from './rules';
import { getTrack, type Track } from './track';

const track = getTrack('park-loop');
const STEP = 1 / 60;

function pinToRail(car: PlayerCar, target: Track): void {
	const sample = target.sampleAt(0.1);
	car.pos.copy(sample.pos).addScaledVector(sample.normal, target.maxLateral + 0.5);
	car.prevIndex = sample.index;
	car.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
	car.speed = 11.5;
	car.wallContactTime = 2.5;
}

describe('race distance', () => {
	it('counts three laps and never more', () => {
		const car = new PlayerCar('bear', track, false);
		car.raceDistance = track.length * 2.5;
		car.update(STEP, 0, false);
		expect(car.lap).toBe(3);

		car.raceDistance = track.length * (LAPS + 5);
		car.update(STEP, 0, false);
		expect(car.lap).toBe(LAPS);
	});

	it('finishes when the third lap is complete, not on balloons', () => {
		const car = new PlayerCar('bear', track, false);
		car.raceDistance = track.length * (LAPS - 1) + track.length - 0.4;

		for (let frame = 0; frame < 120 && !car.finished; frame++) {
			car.update(STEP, 0, false);
		}

		expect(car.finished).toBe(true);
		expect(car.lap).toBe(LAPS);
	});
});

describe('advanced driving has no help', () => {
	it('never engages auto-steer, even after long rail contact', () => {
		const car = new PlayerCar('bear', track, false);
		pinToRail(car, track);

		for (let frame = 0; frame < 60; frame++) {
			car.update(STEP, 0, false);
		}

		expect(car.assist).toBe(false);
		expect(car.autoSteering).toBe(false);
	});

	it('still engages auto-steer for the assisted mode', () => {
		const car = new PlayerCar('bear', track, true);
		pinToRail(car, track);

		let engaged = false;
		for (let frame = 0; frame < 60 && !engaged; frame++) {
			car.update(STEP, 0, false);
			engaged = car.autoSteering;
		}

		expect(engaged).toBe(true);
	});
});

describe('advanced speed', () => {
	const kmh = (ms: number) => ms * 3.6;

	it('cruises at 50 km/h and reaches 52 km/h on a long straight', () => {
		expect(kmh(targetSpeedFor(true, 0, false, false))).toBeCloseTo(50, 1);
		expect(kmh(targetSpeedFor(true, 1.2, false, false))).toBeGreaterThan(50);
		expect(kmh(targetSpeedFor(true, 2.5, false, false))).toBeCloseTo(52, 1);
	});

	it('keeps the assisted cruise at 41 km/h', () => {
		expect(kmh(targetSpeedFor(false, 2.5, false, false))).toBeCloseTo(41.4, 1);
	});

	it('slows down after hitting a wall', () => {
		const clean = targetSpeedFor(true, 2.5, false, false);
		const hit = targetSpeedFor(true, 2.5, false, true);
		expect(hit).toBeLessThan(clean * 0.7);
		expect(kmh(hit)).toBeLessThan(36);
	});

	it('boosts to just under the dial limit', () => {
		expect(kmh(targetSpeedFor(true, 2.5, true, false))).toBeLessThan(60);
	});
});
