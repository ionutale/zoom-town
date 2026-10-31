import * as THREE from 'three';
import { CAR_BY_ID, CARS, type CarId } from './cars';
import { CRUISE_SPEED, createCarVisual, type PlayerCar } from './car';
import { START_T, sampleAt, sampleAtDistance } from './track';

const RIVAL_IDS: CarId[] = ['bear', 'bunny', 'fox', 'cat'];
const LANES = [-2.25, 0, 2.25];
const SPEEDS = [0.94, 1.0, 1.06];
const START_GAPS = [5, 10, 15];

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

	constructor(id: CarId, index: number) {
		this.id = id;
		this.spec = CAR_BY_ID[id];
		this.visual = createCarVisual(this.spec, false);
		this.baseLane = LANES[index % LANES.length];
		this.lane = this.baseLane;
		this.speedMul = SPEEDS[index % SPEEDS.length];
		this.startGap = START_GAPS[index % START_GAPS.length];
		this.reset();
	}

	reset(): void {
		this.startDistance = sampleAt(START_T).distance;
		this.distance = this.startDistance + this.startGap;
		this.lane = this.baseLane;
		this.avoid = 0;
		this.cooldown = 0;
		this.sync();
	}

	sync(): void {
		const s = sampleAtDistance(this.distance);
		this.visual.group.position.set(
			s.pos.x + s.normal.x * this.lane,
			0,
			s.pos.z + s.normal.z * this.lane
		);
		this.visual.group.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
	}

	update(dt: number, player: PlayerCar): void {
		const s = sampleAtDistance(this.distance);
		const playerPos = player.pos;
		const dx = playerPos.x - s.pos.x;
		const dz = playerPos.z - s.pos.z;
		const nearPlayer = Math.sqrt(dx * dx + dz * dz);

		const gap = this.distance - this.startDistance - player.raceDistance;
		let rubber = 1;
		if (gap > 25) rubber = 1.08;
		else if (gap < -25) rubber = 0.92;

		if (nearPlayer < 2.6) {
			const playerLane = dx * s.normal.x + dz * s.normal.z;
			const away = Math.sign(this.lane - playerLane) || 1;
			this.avoid += away * dt * 4.5;
		}
		this.avoid = THREE.MathUtils.clamp(this.avoid, -1.1, 1.1);
		this.lane = THREE.MathUtils.clamp(this.baseLane + this.avoid, -2.55, 2.55);

		const targetLane = this.baseLane + this.avoid;
		this.lane += (targetLane - this.lane) * Math.min(1, dt * 3);

		this.distance += CRUISE_SPEED * this.speedMul * rubber * dt;

		this.cooldown = Math.max(0, this.cooldown - dt);
		this.sync();
	}

	tryBump(player: PlayerCar): boolean {
		if (this.cooldown > 0) return false;
		const dx = player.pos.x - this.visual.group.position.x;
		const dz = player.pos.z - this.visual.group.position.z;
		const distance = Math.sqrt(dx * dx + dz * dz);
		if (distance > 1.95) return false;
		const length = Math.max(0.001, distance);
		player.pos.x += (dx / length) * 0.16;
		player.pos.z += (dz / length) * 0.16;
		this.lane += Math.sign(this.baseLane - this.lane || 1) * 0.18;
		this.avoid = THREE.MathUtils.clamp(this.avoid + 0.2, -1.1, 1.1);
		this.cooldown = 0.6;
		return true;
	}
}

export function createRivals(playerCarId: CarId): Rival[] {
	const ids = RIVAL_IDS.filter((id) => id !== playerCarId).slice(0, 3);
	return ids.map((id, index) => new Rival(id, index));
}

export function allRivalIds(): CarId[] {
	return [...CARS.map((car) => car.id)];
}
