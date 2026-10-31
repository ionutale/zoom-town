import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { TRACKS, getTrack } from './track';

const track = getTrack('sunny-town');

describe('tracks', () => {
	it('offers five selectable circuits', () => {
		expect(TRACKS.map((entry) => entry.def.id)).toEqual([
			'sunny-town',
			'park-loop',
			'harbor-dash',
			'dino-valley',
			'candy-hills'
		]);
	});
	it('has a long closed circuit', () => {
		expect(track.length).toBeGreaterThan(300);
		expect(track.length).toBeLessThan(520);
		expect(track.samples).toHaveLength(720);
	});

	it('wraps t and distance', () => {
		expect(track.sampleAt(1).t).toBe(0);
		expect(track.sampleAt(-0.1).t).toBeCloseTo(0.9, 5);
		expect(track.sampleAtDistance(track.length + 10).t).toBeCloseTo(
			10 / track.length,
			2
		);
	});

	it('measures lateral offset from the centreline', () => {
		const sample = track.sampleAt(0.2);
		const onCentre = track.nearestSample(sample.pos);
		expect(onCentre.lateral).toBeCloseTo(0, 3);

		const offset = sample.pos.clone().addScaledVector(sample.normal, 2);
		expect(track.nearestSample(offset).lateral).toBeCloseTo(2, 2);
	});

	it('keeps the rail clamp inside the road', () => {
		expect(track.maxLateral).toBeGreaterThan(0);
		expect(track.maxLateral).toBeLessThan(4);
	});

	it('returns a finite tangent and normal', () => {
		const sample = track.sampleAt(0.37);
		expect(sample.tangent.length()).toBeCloseTo(1, 4);
		expect(sample.normal.length()).toBeCloseTo(1, 4);
		expect(Number.isFinite(sample.pos.x)).toBe(true);
		expect(Number.isFinite(sample.pos.z)).toBe(true);
		expect(sample.normal).toBeInstanceOf(THREE.Vector3);
	});
});
