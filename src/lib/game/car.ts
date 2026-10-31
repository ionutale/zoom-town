import * as THREE from 'three';
import { CAR_BY_ID, type CarId, type CarSpec } from './cars';
import { COLORS } from './palette';
import {
	MAX_LATERAL,
	START_T,
	TRACK_LENGTH,
	nearestSample,
	sampleAt,
	type TrackSample
} from './track';

export const CRUISE_SPEED = 11.5;
export const BOOST_MULTIPLIER = 1.4;
export const BOOST_DURATION = 2;
export const MAX_CHARGES = 3;
export const ACCELERATION = 6;
export const STEER_LOW = 2.2;
export const STEER_HIGH = 1.6;

export interface CarVisual {
	group: THREE.Group;
	body: THREE.Group;
	wheels: THREE.Group[];
}

const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.24, 12);
const hubGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.26, 10);
const wheelMaterial = new THREE.MeshLambertMaterial({ color: COLORS.ink });
const hubMaterial = new THREE.MeshLambertMaterial({ color: COLORS.cream });

function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0): THREE.Mesh {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(w, h, d),
		new THREE.MeshLambertMaterial({ color, flatShading: true })
	);
	mesh.position.set(x, y, z);
	return mesh;
}

export function createCarVisual(spec: CarSpec, isPlayer = false): CarVisual {
	const group = new THREE.Group();
	const body = new THREE.Group();
	group.add(body);
	const color = parseInt(spec.color.slice(1), 16);
	const dark = parseInt(spec.dark.slice(1), 16);

	const shadow = new THREE.Mesh(
		new THREE.CircleGeometry(1.15, 24),
		new THREE.MeshBasicMaterial({
			color: 0x26313c,
			transparent: true,
			opacity: 0.18,
			depthWrite: false
		})
	);
	shadow.rotation.x = -Math.PI / 2;
	shadow.position.y = 0.015;
	group.add(shadow);

	body.add(box(1.46, 0.26, 2.26, dark, 0, 0.36, 0));
	body.add(box(1.36, 0.4, 2.12, color, 0, 0.58, 0));
	body.add(box(1.18, 0.16, 0.72, color, 0, 0.82, 0.68));
	body.add(box(1.02, 0.46, 0.98, COLORS.cream, 0, 0.98, -0.12));
	body.add(box(0.92, 0.24, 0.04, COLORS.ink, 0, 1.02, 0.38));
	for (const side of [-1, 1]) {
		body.add(box(0.04, 0.24, 0.66, COLORS.ink, side * 0.52, 1.02, -0.14));
	}
	body.add(box(1.28, 0.08, 0.3, dark, 0, 1.06, -1.0));
	body.add(box(0.08, 0.2, 0.22, dark, 0, 0.92, -1.0));

	for (const side of [-1, 1]) {
		const headlight = new THREE.Mesh(
			new THREE.SphereGeometry(0.11, 10, 8),
			new THREE.MeshBasicMaterial({ color: COLORS.cream })
		);
		headlight.position.set(side * 0.44, 0.64, 1.07);
		body.add(headlight);
		const tail = box(0.22, 0.12, 0.06, COLORS.red, side * 0.46, 0.64, -1.08);
		body.add(tail);
	}

	// Driver
	const driver = new THREE.Group();
	const fur = parseInt(spec.fur.slice(1), 16);
	const furDark = parseInt(spec.furDark.slice(1), 16);
	const head = new THREE.Mesh(
		new THREE.SphereGeometry(0.27, 14, 12),
		new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
	);
	head.position.set(0, 1.28, -0.1);
	driver.add(head);

	const muzzle = new THREE.Mesh(
		new THREE.SphereGeometry(0.12, 10, 8),
		new THREE.MeshLambertMaterial({ color: spec.id === 'bunny' ? COLORS.white : furDark })
	);
	muzzle.position.set(0, 1.22, 0.08);
	muzzle.scale.set(1.2, 0.8, 0.7);
	driver.add(muzzle);

	for (const side of [-1, 1]) {
		const eye = new THREE.Mesh(
			new THREE.SphereGeometry(0.032, 8, 6),
			new THREE.MeshBasicMaterial({ color: COLORS.ink })
		);
		eye.position.set(side * 0.09, 1.34, 0.16);
		driver.add(eye);
	}

	if (spec.ears === 'round') {
		for (const side of [-1, 1]) {
			const ear = new THREE.Mesh(
				new THREE.SphereGeometry(0.13, 10, 8),
				new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
			);
			ear.position.set(side * 0.2, 1.5, -0.1);
			driver.add(ear);
		}
	} else if (spec.ears === 'long') {
		for (const side of [-1, 1]) {
			const ear = new THREE.Mesh(
				new THREE.SphereGeometry(0.09, 10, 8),
				new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
			);
			ear.scale.set(1, 3.4, 0.8);
			ear.position.set(side * 0.13, 1.66, -0.1);
			ear.rotation.z = side * 0.12;
			driver.add(ear);
		}
	} else {
		const cone = spec.ears === 'pointed' ? 0.34 : 0.25;
		for (const side of [-1, 1]) {
			const ear = new THREE.Mesh(
				new THREE.ConeGeometry(0.1, cone, 6),
				new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
			);
			ear.position.set(side * 0.16, 1.52, -0.1);
			ear.rotation.z = side * -0.16;
			driver.add(ear);
		}
	}

	if (spec.tail) {
		const tail = new THREE.Mesh(
			spec.id === 'bunny'
				? new THREE.SphereGeometry(0.14, 10, 8)
				: new THREE.ConeGeometry(0.14, 0.5, 8),
			new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
		);
		tail.position.set(0, spec.id === 'bunny' ? 0.85 : 0.95, -1.18);
		if (spec.id !== 'bunny') tail.rotation.x = Math.PI / 2.4;
		driver.add(tail);
	}

	if (isPlayer) {
		const balloonMark = new THREE.Mesh(
			new THREE.SphereGeometry(0.11, 10, 8),
			new THREE.MeshBasicMaterial({ color: COLORS.red })
		);
		balloonMark.position.set(0.55, 0.62, -0.72);
		body.add(balloonMark);
	}

	body.add(driver);

	const wheels: THREE.Group[] = [];
	for (const x of [-0.72, 0.72]) {
		for (const z of [-0.68, 0.68]) {
			const wheel = new THREE.Group();
			const tyre = new THREE.Mesh(wheelGeometry, wheelMaterial);
			tyre.rotation.z = Math.PI / 2;
			wheel.add(tyre);
			const hub = new THREE.Mesh(hubGeometry, hubMaterial);
			hub.rotation.z = Math.PI / 2;
			wheel.add(hub);
			wheel.position.set(x, 0.3, z);
			body.add(wheel);
			wheels.push(wheel);
		}
	}

	return { group, body, wheels };
}

function shortestAngle(angle: number): number {
	return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export interface CarUpdate {
	near: ReturnType<typeof nearestSample>;
	boostStarted: boolean;
	railContact: boolean;
}

export class PlayerCar {
	spec: CarSpec;
	visual: CarVisual;
	pos = new THREE.Vector3();
	heading = 0;
	speed = 0;
	boostTime = 0;
	charges = 0;
	touchingRail = false;
	raceDistance = 0;
	lap = 1;
	prevIndex = 0;
	finished = false;
	steerVisual = 0;
	stuckTime = 0;
	wrongWayTime = 0;
	safeTimer = 0;
	safePos = new THREE.Vector3();
	safeHeading = 0;

	constructor(carId: CarId) {
		this.spec = CAR_BY_ID[carId];
		this.visual = createCarVisual(this.spec, true);
		this.reset();
	}

	reset(): void {
		const s = sampleAt(START_T);
		this.pos.copy(s.pos);
		this.heading = Math.atan2(s.tangent.x, s.tangent.z);
		this.speed = 0;
		this.boostTime = 0;
		this.charges = 0;
		this.touchingRail = false;
		this.raceDistance = 0;
		this.lap = 1;
		this.prevIndex = s.index;
		this.finished = false;
		this.steerVisual = 0;
		this.stuckTime = 0;
		this.wrongWayTime = 0;
		this.safeTimer = 0;
		this.safePos.copy(s.pos);
		this.safeHeading = this.heading;
		this.visual.group.position.copy(this.pos);
		this.visual.group.rotation.y = this.heading;
	}

	setCar(carId: CarId): void {
		this.spec = CAR_BY_ID[carId];
		this.visual.group.removeFromParent();
		this.visual = createCarVisual(this.spec, true);
		this.reset();
	}

	addCharge(): void {
		this.charges = Math.min(MAX_CHARGES, this.charges + 1);
	}

	requestBoost(): boolean {
		if (this.charges < 1 || this.boostTime > 0 || this.finished) return false;
		this.charges--;
		this.boostTime = BOOST_DURATION;
		return true;
	}

	get lapProgress(): number {
		return THREE.MathUtils.clamp(this.raceDistance / TRACK_LENGTH, 0, 2);
	}

	update(dt: number, steer: number, frozen: boolean): CarUpdate {
		const before = nearestSample(this.pos, this.prevIndex);
		const tangentHeading = Math.atan2(before.sample.tangent.x, before.sample.tangent.z);
		const railContact = this.touchingRail;

		if (!frozen && !this.finished) {
			const targetSpeed =
				CRUISE_SPEED * (this.boostTime > 0 ? BOOST_MULTIPLIER : 1) * (railContact ? 0.9 : 1);
			const maxDelta = ACCELERATION * dt;
			const brakeDelta = ACCELERATION * 2.2 * dt;
			if (this.speed < targetSpeed) {
				this.speed = Math.min(targetSpeed, this.speed + maxDelta);
			} else {
				this.speed = Math.max(targetSpeed, this.speed - brakeDelta);
			}

			const speedFactor = THREE.MathUtils.clamp(this.speed / CRUISE_SPEED, 0, 1);
			const steerRate = THREE.MathUtils.lerp(STEER_LOW, STEER_HIGH, speedFactor);
			// Screen-right is world -X when the camera looks along +Z; flip the
			// heading sign so the on-screen arrows match the car's direction.
			this.heading -= steer * steerRate * dt;
			this.steerVisual += (steer - this.steerVisual) * Math.min(1, dt * 10);

			const assist = steer === 0 ? 3.6 : 0.12;
			this.heading += shortestAngle(tangentHeading - this.heading) * Math.min(1, assist * dt);

			const forwardX = Math.sin(this.heading);
			const forwardZ = Math.cos(this.heading);
			this.pos.x += forwardX * this.speed * dt;
			this.pos.z += forwardZ * this.speed * dt;

			const near = nearestSample(this.pos, before.index);
			if (Math.abs(near.lateral) > MAX_LATERAL) {
				const sign = Math.sign(near.lateral) || 1;
				// Keep the car's progress along the tangent; only remove the
				// sideways overshoot. Snapping to the sample centre would pin
				// the car at the rail forever.
				const along =
					(this.pos.x - near.sample.pos.x) * near.sample.tangent.x +
					(this.pos.z - near.sample.pos.z) * near.sample.tangent.z;
				this.pos.x =
					near.sample.pos.x +
					near.sample.tangent.x * along +
					near.sample.normal.x * MAX_LATERAL * sign;
				this.pos.z =
					near.sample.pos.z +
					near.sample.tangent.z * along +
					near.sample.normal.z * MAX_LATERAL * sign;
				// Slide along the rail instead of pinning the car into it.
				this.heading += shortestAngle(tangentHeading - this.heading) * 0.9;
				this.touchingRail = true;
			} else {
				this.touchingRail = false;
			}

			const after = nearestSample(this.pos, near.index);
			if (steer === 0 && Math.abs(after.lateral) > 0.35) {
				// With no input, gently drift back to the racing line so a
				// five-year-old is never parked against a rail.
				const pull = Math.min(1, dt * 1.6);
				this.pos.x += after.sample.normal.x * -after.lateral * pull;
				this.pos.z += after.sample.normal.z * -after.lateral * pull;
			}
			const forwardXNow = Math.sin(this.heading);
			const forwardZNow = Math.cos(this.heading);
			const forwardDot =
				forwardXNow * after.sample.tangent.x + forwardZNow * after.sample.tangent.z;

			if (forwardDot < -0.2) this.wrongWayTime += dt;
			else this.wrongWayTime = 0;
			if (this.speed < 0.4) this.stuckTime += dt;
			else this.stuckTime = 0;
			this.safeTimer += dt;
			if (this.safeTimer > 1 && Math.abs(after.lateral) < MAX_LATERAL - 0.6 && forwardDot > 0.5) {
				this.safePos.copy(this.pos);
				this.safeHeading = this.heading;
				this.safeTimer = 0;
			}
			if (this.wrongWayTime > 1.5 || this.stuckTime > 2) {
				this.recover();
				this.syncVisual(dt);
				return {
					near: nearestSample(this.pos, this.prevIndex),
					boostStarted: false,
					railContact: false
				};
			}

			let delta = after.sample.distance - before.sample.distance;
			if (delta < -TRACK_LENGTH / 2) delta += TRACK_LENGTH;
			if (delta > TRACK_LENGTH / 2) delta -= TRACK_LENGTH;
			this.raceDistance = Math.min(TRACK_LENGTH * 2, this.raceDistance + delta);
			this.lap = Math.min(2, Math.floor(this.raceDistance / TRACK_LENGTH) + 1);

			if (this.boostTime > 0) this.boostTime = Math.max(0, this.boostTime - dt);
			if (this.raceDistance >= TRACK_LENGTH * 2) this.finished = true;
			this.prevIndex = after.index;
			this.syncVisual(dt);
		} else if (frozen) {
			this.speed = Math.max(0, this.speed - ACCELERATION * 2 * dt);
			this.syncVisual(dt);
		} else {
			this.speed = Math.max(0, this.speed - ACCELERATION * 2 * dt);
			this.pos.x += Math.sin(this.heading) * this.speed * dt;
			this.pos.z += Math.cos(this.heading) * this.speed * dt;
			this.syncVisual(dt);
		}

		return {
			near: nearestSample(this.pos, this.prevIndex),
			boostStarted: false,
			railContact: this.touchingRail
		};
	}

	recover(): void {
		this.pos.copy(this.safePos);
		this.heading = this.safeHeading;
		this.speed = 0;
		this.touchingRail = false;
		this.stuckTime = 0;
		this.wrongWayTime = 0;
		this.safeTimer = 0;
		this.prevIndex = nearestSample(this.pos).index;
	}

	syncVisual(dt: number): void {
		this.visual.group.position.copy(this.pos);
		this.visual.group.rotation.y = this.heading;
		const boost = this.boostTime > 0 ? 1 : 0;
		this.visual.body.rotation.z = -this.steerVisual * 0.055;
		this.visual.body.rotation.x = THREE.MathUtils.lerp(
			this.visual.body.rotation.x,
			boost ? -0.035 : 0,
			Math.min(1, dt * 6)
		);
		for (const wheel of this.visual.wheels) {
			wheel.rotation.x -= (this.speed / 0.3) * dt;
		}
	}
}
