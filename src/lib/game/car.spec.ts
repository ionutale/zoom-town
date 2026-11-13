import { describe, expect, it } from 'vitest';
import {
	ADVANCED_CRUISE,
	ADVANCED_TOP,
	AUTOPILOT_IDLE_SECONDS,
	PlayerCar,
	targetSpeedFor
} from './car';
import { LAPS } from './rules';
import { getTrack } from './track';

const track = getTrack('park-loop');
const STEP = 1 / 60;

/** Drives with no steering input for `seconds`. */
function idle(car: PlayerCar, seconds: number): void {
	const steps = Math.ceil(seconds / STEP);
	for (let step = 0; step < steps; step++) car.update(STEP, 0, false);
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

describe('autopilot', () => {
	it('takes over after five seconds without steering input', () => {
		const car = new PlayerCar('bear', track, true);
		idle(car, AUTOPILOT_IDLE_SECONDS - 0.5);
		expect(car.autoSteering).toBe(false);

		idle(car, 1);
		expect(car.autoSteering).toBe(true);
	});

	it('hands control back the moment the child steers', () => {
		const car = new PlayerCar('bear', track, true);
		idle(car, AUTOPILOT_IDLE_SECONDS + 0.2);
		expect(car.autoSteering).toBe(true);

		car.update(STEP, 0.6, false);
		expect(car.autoSteering).toBe(false);
		expect(car.idleTime).toBe(0);
	});

	it('never takes over while the child keeps steering', () => {
		const car = new PlayerCar('bear', track, true);
		idle(car, AUTOPILOT_IDLE_SECONDS + 0.2);

		for (let step = 0; step < 12 * 60; step++) car.update(STEP, 0.8, false);

		expect(car.autoSteering).toBe(false);
	});

	it('re-engages after a fresh five seconds of idle', () => {
		const car = new PlayerCar('bear', track, true);
		idle(car, AUTOPILOT_IDLE_SECONDS + 0.2);
		car.update(STEP, 1, false);
		expect(car.autoSteering).toBe(false);

		idle(car, AUTOPILOT_IDLE_SECONDS - 0.5);
		expect(car.autoSteering).toBe(false);

		idle(car, 1);
		expect(car.autoSteering).toBe(true);
	});

	it('never engages in advanced driving', () => {
		const car = new PlayerCar('bear', track, false);
		idle(car, AUTOPILOT_IDLE_SECONDS + 4);

		expect(car.idleTime).toBeGreaterThan(AUTOPILOT_IDLE_SECONDS);
		expect(car.autoSteering).toBe(false);
	});

	it('centres the car and keeps making progress while it drives itself', () => {
		const car = new PlayerCar('bear', track, true);
		const sample = track.sampleAt(0.2);
		car.pos.copy(sample.pos).addScaledVector(sample.normal, track.maxLateral * 0.9);
		car.prevIndex = sample.index;
		car.heading = Math.atan2(sample.tangent.x, sample.tangent.z);
		car.speed = 11.5;

		const startDistance = car.raceDistance;
		for (let step = 0; step < 15 * 60; step++) car.update(STEP, 0, false);

		const lateral = Math.abs(track.nearestSample(car.pos, car.prevIndex).lateral);
		expect(lateral).toBeLessThan(1);
		expect(car.raceDistance).toBeGreaterThan(startDistance + 100);
		expect(car.autoSteering).toBe(true);
	});

	it('is switched off (and stays off) in advanced driving', () => {
		const car = new PlayerCar('bear', track, true);
		idle(car, AUTOPILOT_IDLE_SECONDS + 0.2);
		expect(car.autoSteering).toBe(true);

		car.assist = false;
		car.update(STEP, 0, false);
		expect(car.autoSteering).toBe(false);
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
		expect(ADVANCED_CRUISE).toBeLessThan(ADVANCED_TOP);
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
