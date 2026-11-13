import * as THREE from 'three';
import { CAR_BY_ID, type CarId } from './cars';
import { CRUISE_SPEED, createCarVisual, type PlayerCar } from './car';
import { disposeObject3D } from './dispose';
import type { Track } from './track';

const RIVAL_IDS: CarId[] = ['bear', 'bunny', 'fox', 'cat'];
const LANES = [-2.25, 0, 2.25];
const SPEEDS = [0.94, 1.0, 1.06];
const START_GAPS = [5, 10, 15];

/** Rubber-band: how far ahead/behind the player starts changing rival speed. */
const RUBBER_DISTANCE = 25;
const RUBBER_UP = 1.08;
const RUBBER_DOWN = 0.92;

/** Side-step away from the player before contact. */
const AVOID_RADIUS = 2.6;
const AVOID_PUSH = 4.5;
const AVOID_LIMIT = 1.1;
const LANE_LIMIT = 2.55;
const LANE_EASE = 3;

/** Soft bump: push apart, no speed loss, then wait before pushing again. */
const BUMP_RADIUS = 1.95;
const BUMP_PUSH = 0.16;
const BUMP_COOLDOWN = 0.6;

export class Rival {
	id: CarId;
	spec = CAR_BY_ID.bear;
	visual;
	distance = 0;
	lane = 0;
	baseLane = 0;
	speedMul = 1;
	startGap = 0;
	cooldown = 0;
	avoid = 0;
	startDistance = 0;
	track: Track;

	constructor(id: CarId, index: number, track: Track) {
		this.id = id;
		this.track = track;
		this.spec = CAR_BY_ID[id];
		this.visual = createCarVisual(this.spec, false);
		this.baseLane = LANES[index % LANES.length];
		this.lane = this.baseLane;
		this.speedMul = SPEEDS[index % SPEEDS.length];
		this.startGap = START_GAPS[index % START_GAPS.length];
		this.reset();
	}

	reset(): void {
		this.startDistance = this.track.sampleAt(this.track.startT).distance;
		this.distance = this.startDistance + this.startGap;
		this.lane = this.baseLane;
		this.avoid = 0;
		this.cooldown = 0;
		this.sync();
	}

	/** Releases this rival's own GPU buffers. Shared wheel resources survive. */
	dispose(): void {
		disposeObject3D(this.visual.group);
		this.visual.group.removeFromParent();
	}

	sync(): void {
		const s = this.track.sampleAtDistance(this.distance);
		this.visual.group.position.set(
			s.pos.x + s.normal.x * this.lane,
			0,
			s.pos.z + s.normal.z * this.lane
		);
		this.visual.group.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
	}

	update(dt: number, player: PlayerCar): void {
		const s = this.track.sampleAtDistance(this.distance);
		const playerPos = player.pos;
		const dx = playerPos.x - s.pos.x;
		const dz = playerPos.z - s.pos.z;
		const nearPlayer = Math.sqrt(dx * dx + dz * dz);

		const gap = this.distance - this.startDistance - player.raceDistance;
		let rubber = 1;
		if (gap > RUBBER_DISTANCE) rubber = RUBBER_UP;
		else if (gap < -RUBBER_DISTANCE) rubber = RUBBER_DOWN;

		if (nearPlayer < AVOID_RADIUS) {
			const playerLane = dx * s.normal.x + dz * s.normal.z;
			const away = Math.sign(this.lane - playerLane) || 1;
			this.avoid += away * dt * AVOID_PUSH;
		}
		this.avoid = THREE.MathUtils.clamp(this.avoid, -AVOID_LIMIT, AVOID_LIMIT);

		const targetLane = THREE.MathUtils.clamp(this.baseLane + this.avoid, -LANE_LIMIT, LANE_LIMIT);
		this.lane += (targetLane - this.lane) * Math.min(1, dt * LANE_EASE);

		this.distance += CRUISE_SPEED * this.speedMul * rubber * dt;

		this.cooldown = Math.max(0, this.cooldown - dt);
		this.sync();
	}

	tryBump(player: PlayerCar): boolean {
		if (this.cooldown > 0) return false;
		const dx = player.pos.x - this.visual.group.position.x;
		const dz = player.pos.z - this.visual.group.position.z;
		const distance = Math.sqrt(dx * dx + dz * dz);
		if (distance > BUMP_RADIUS) return false;
		const length = Math.max(0.001, distance);
		// The push goes through the car so the guardrail still applies: a bump
		// can never shove the player off the road.
		player.nudge((dx / length) * BUMP_PUSH, (dz / length) * BUMP_PUSH);
		this.lane += Math.sign(this.baseLane - this.lane || 1) * 0.18;
		this.avoid = THREE.MathUtils.clamp(this.avoid + 0.2, -AVOID_LIMIT, AVOID_LIMIT);
		this.cooldown = BUMP_COOLDOWN;
		return true;
	}
}

export function createRivals(playerCarId: CarId, track: Track): Rival[] {
	const ids = RIVAL_IDS.filter((id) => id !== playerCarId).slice(0, 3);
	return ids.map((id, index) => new Rival(id, index, track));
}
