import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
	MAX_LATERAL,
	TRACK_LENGTH,
	nearestSample,
	sampleAt,
	sampleAtDistance,
	samples
} from './track';

describe('track', () => {
	it('is a long closed circuit', () => {
		expect(TRACK_LENGTH).toBeGreaterThan(400);
		expect(TRACK_LENGTH).toBeLessThan(500);
		expect(samples).toHaveLength(720);
	});

	it('wraps t and distance', () => {
		expect(sampleAt(1).t).toBe(0);
		expect(sampleAt(-0.1).t).toBeCloseTo(0.9, 5);
		expect(sampleAtDistance(TRACK_LENGTH + 10).t).toBeCloseTo(10 / TRACK_LENGTH, 2);
	});

	it('measures lateral offset from the centreline', () => {
		const sample = sampleAt(0.2);
		const onCentre = nearestSample(sample.pos);
		expect(onCentre.lateral).toBeCloseTo(0, 3);

		const offset = sample.pos.clone().addScaledVector(sample.normal, 2);
		expect(nearestSample(offset).lateral).toBeCloseTo(2, 2);
	});

	it('keeps the rail clamp inside the road', () => {
		expect(MAX_LATERAL).toBeGreaterThan(0);
		expect(MAX_LATERAL).toBeLessThan(TRACK_LENGTH);
		expect(MAX_LATERAL).toBeLessThan(4);
	});

	it('returns a finite tangent and normal', () => {
		const sample = sampleAt(0.37);
		expect(sample.tangent.length()).toBeCloseTo(1, 4);
		expect(sample.normal.length()).toBeCloseTo(1, 4);
		expect(Number.isFinite(sample.pos.x)).toBe(true);
		expect(Number.isFinite(sample.pos.z)).toBe(true);
		expect(sample.normal).toBeInstanceOf(THREE.Vector3);
	});
});
