import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { disposeObject3D, markSharedResource } from './dispose';
import { mergeMeshesByMaterial } from './merge';
import { CAR_BY_ID, type CarId, type CarSpec } from './cars';
import { COLORS } from './palette';
import { LAPS } from './rules';
import type { NearestResult, Track } from './track';

export const CRUISE_SPEED = 11.5;
export const BOOST_MULTIPLIER = 1.4;
/** Advanced driving: 50 km/h cruise, drifting to 52 km/h on long straights. */
export const ADVANCED_CRUISE = 50 / 3.6;
export const ADVANCED_TOP = 52 / 3.6;
export const ADVANCED_BOOST = 1.15;
export const ADVANCED_RAIL_FACTOR = 0.65;
const ADVANCED_RAMP_SECONDS = 2.5;
const STRAIGHT_STEER = 0.2;
export const BOOST_DURATION = 2;
export const MAX_CHARGES = 3;
export const ACCELERATION = 6;
export const STEER_LOW = 2.2;
export const STEER_HIGH = 1.6;

/** How far the car drifts toward the road tangent without help, per second. */
const TANGENT_FOLLOW = 0.08;
const RAIL_SLIDE_ALIGN = 0.9;
const BRAKE_MULTIPLIER = 2.2;
const COAST_BRAKE_MULTIPLIER = 2;

/** Any steering beyond this counts as the child taking the wheel. */
const STEER_INPUT_THRESHOLD = 0.05;

/**
 * Autopilot (assisted mode only): after this many seconds without steering
 * input the car drives itself along the road. It hands control back on the
 * first steering input and never times itself out.
 */
export const AUTOPILOT_IDLE_SECONDS = 5;
const AUTOPILOT_ALIGN_RATE = 4.2;
const AUTOPILOT_PULL_RATE = 2.6;

/** Auto-recover thresholds. */
const WRONG_WAY_DOT = -0.2;
const WRONG_WAY_SECONDS = 1.5;
const STUCK_SPEED = 0.4;
const STUCK_SECONDS = 2;
const SAFE_SAMPLE_SECONDS = 1;
const SAFE_MARGIN = 0.6;

export function targetSpeedFor(
	advanced: boolean,
	straightTime: number,
	boosting: boolean,
	railContact: boolean
): number {
	const ramp = Math.min(1, straightTime / ADVANCED_RAMP_SECONDS);
	const base = advanced ? THREE.MathUtils.lerp(ADVANCED_CRUISE, ADVANCED_TOP, ramp) : CRUISE_SPEED;
	const boost = boosting ? (advanced ? ADVANCED_BOOST : BOOST_MULTIPLIER) : 1;
	const rail = railContact ? (advanced ? ADVANCED_RAIL_FACTOR : 0.9) : 1;
	return base * boost * rail;
}

export interface CarVisual {
	group: THREE.Group;
	body: THREE.Group;
	wheels: THREE.InstancedMesh;
	wheelAngle: number;
}

const WHEEL_RADIUS = 0.3;
const WHEEL_POSITIONS = [-0.72, 0.72].flatMap((x) =>
	[-0.68, 0.68].map((z) => new THREE.Vector3(x, 0.3, z))
);

const wheelGeometry = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.24, 12);
const hubGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.26, 10);

function tintGeometry(geometry: THREE.BufferGeometry, color: number): void {
	const vertexColor = new THREE.Color(color);
	const count = geometry.getAttribute('position').count;
	const colors = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		colors[i * 3] = vertexColor.r;
		colors[i * 3 + 1] = vertexColor.g;
		colors[i * 3 + 2] = vertexColor.b;
	}
	geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

// Tyre and hub share one geometry so all four wheels spin as a single
// InstancedMesh. Vertex colours keep the two original colours.
const wheelSpinGeometry = (() => {
	const rotation = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
	const tyre = wheelGeometry.clone().applyMatrix4(rotation);
	const hub = hubGeometry.clone().applyMatrix4(rotation);
	tintGeometry(tyre, COLORS.ink);
	tintGeometry(hub, COLORS.cream);
	const merged = mergeGeometries([tyre, hub], false);
	return merged ?? tyre;
})();

const wheelMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

// Every car (player and rivals) spins the same wheel mesh data, so it must
// survive a single car being disposed and rebuilt.
markSharedResource(wheelSpinGeometry, wheelMaterial);

function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0): THREE.Mesh {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(w, h, d),
		new THREE.MeshLambertMaterial({ color, flatShading: true })
	);
	mesh.position.set(x, y, z);
	return mesh;
}

const wheelQuaternion = new THREE.Quaternion();
const wheelMatrix = new THREE.Matrix4();
const unitScale = new THREE.Vector3(1, 1, 1);
const wheelAxis = new THREE.Vector3(1, 0, 0);

function setWheelAngle(wheels: THREE.InstancedMesh, angle: number): void {
	wheelQuaternion.setFromAxisAngle(wheelAxis, angle);
	WHEEL_POSITIONS.forEach((position, index) => {
		wheelMatrix.compose(position, wheelQuaternion, unitScale);
		wheels.setMatrixAt(index, wheelMatrix);
	});
	wheels.instanceMatrix.needsUpdate = true;
}

function createWheels(): THREE.InstancedMesh {
	const wheels = new THREE.InstancedMesh(wheelSpinGeometry, wheelMaterial, WHEEL_POSITIONS.length);
	wheels.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	setWheelAngle(wheels, 0);
	return wheels;
}

export function createCarVisual(spec: CarSpec, isPlayer = false): CarVisual {
	const group = new THREE.Group();
	const body = new THREE.Group();
	group.add(body);
	const color = parseInt(spec.color.slice(1), 16);
	const dark = parseInt(spec.dark.slice(1), 16);
	const parts: THREE.Mesh[] = [];

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

	parts.push(box(1.46, 0.26, 2.26, dark, 0, 0.36, 0));
	parts.push(box(1.36, 0.4, 2.12, color, 0, 0.58, 0));
	parts.push(box(1.18, 0.16, 0.72, color, 0, 0.82, 0.68));
	parts.push(box(1.02, 0.46, 0.98, COLORS.cream, 0, 0.98, -0.12));
	parts.push(box(0.92, 0.24, 0.04, COLORS.ink, 0, 1.02, 0.38));
	for (const side of [-1, 1]) {
		parts.push(box(0.04, 0.24, 0.66, COLORS.ink, side * 0.52, 1.02, -0.14));
	}
	parts.push(box(1.28, 0.08, 0.3, dark, 0, 1.06, -1.0));
	parts.push(box(0.08, 0.2, 0.22, dark, 0, 0.92, -1.0));

	for (const side of [-1, 1]) {
		const headlight = new THREE.Mesh(
			new THREE.SphereGeometry(0.11, 10, 8),
			new THREE.MeshBasicMaterial({ color: COLORS.cream })
		);
		headlight.position.set(side * 0.44, 0.64, 1.07);
		parts.push(headlight);
		parts.push(box(0.22, 0.12, 0.06, COLORS.red, side * 0.46, 0.64, -1.08));
	}

	// Driver
	const fur = parseInt(spec.fur.slice(1), 16);
	const furDark = parseInt(spec.furDark.slice(1), 16);
	const head = new THREE.Mesh(
		new THREE.SphereGeometry(0.27, 14, 12),
		new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
	);
	head.position.set(0, 1.28, -0.1);
	parts.push(head);

	const muzzle = new THREE.Mesh(
		new THREE.SphereGeometry(0.12, 10, 8),
		new THREE.MeshLambertMaterial({ color: spec.id === 'bunny' ? COLORS.white : furDark })
	);
	muzzle.position.set(0, 1.22, 0.08);
	muzzle.scale.set(1.2, 0.8, 0.7);
	parts.push(muzzle);

	for (const side of [-1, 1]) {
		const eye = new THREE.Mesh(
			new THREE.SphereGeometry(0.032, 8, 6),
			new THREE.MeshBasicMaterial({ color: COLORS.ink })
		);
		eye.position.set(side * 0.09, 1.34, 0.16);
		parts.push(eye);
	}

	if (spec.ears === 'round') {
		for (const side of [-1, 1]) {
			const ear = new THREE.Mesh(
				new THREE.SphereGeometry(0.13, 10, 8),
				new THREE.MeshLambertMaterial({ color: fur, flatShading: true })
			);
			ear.position.set(side * 0.2, 1.5, -0.1);
			parts.push(ear);
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
			parts.push(ear);
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
			parts.push(ear);
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
		parts.push(tail);
	}

	if (isPlayer) {
		const balloonMark = new THREE.Mesh(
			new THREE.SphereGeometry(0.11, 10, 8),
			new THREE.MeshBasicMaterial({ color: COLORS.red })
		);
		balloonMark.position.set(0.55, 0.62, -0.72);
		parts.push(balloonMark);
	}

	body.add(...mergeMeshesByMaterial(parts));
	const wheels = createWheels();
	body.add(wheels);

	return { group, body, wheels, wheelAngle: 0 };
}

function shortestAngle(angle: number): number {
	return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export interface CarUpdate {
	near: NearestResult;
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
	idleTime = 0;
	autoSteering = false;
	straightTime = 0;

	track: Track;
	/** Steering help (autopilot). Off in Advanced driving. */
	assist: boolean;

	constructor(carId: CarId, track: Track, assist = true) {
		this.track = track;
		this.spec = CAR_BY_ID[carId];
		this.assist = assist;
		this.visual = createCarVisual(this.spec, true);
		this.reset();
	}

	reset(): void {
		const s = this.track.sampleAt(this.track.startT);
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
		this.idleTime = 0;
		this.autoSteering = false;
		this.straightTime = 0;
		this.visual.group.position.copy(this.pos);
		this.visual.group.rotation.y = this.heading;
	}

	/** Releases this car's own GPU buffers. Shared wheel resources survive. */
	dispose(): void {
		disposeObject3D(this.visual.group);
		this.visual.group.removeFromParent();
	}

	addCharge(): void {
		this.charges = Math.min(MAX_CHARGES, this.charges + 1);
	}

	/** Applies a sideways shove (rival bump) without letting the car leave the road. */
	nudge(dx: number, dz: number): void {
		this.pos.x += dx;
		this.pos.z += dz;
		const near = this.track.nearestSample(this.pos, this.prevIndex);
		this.applyGuardrail(near, Math.atan2(near.sample.tangent.x, near.sample.tangent.z));
	}

	requestBoost(): boolean {
		if (this.charges < 1 || this.boostTime > 0 || this.finished) return false;
		this.charges--;
		this.boostTime = BOOST_DURATION;
		return true;
	}

	update(dt: number, steer: number, frozen: boolean): CarUpdate {
		const before = this.track.nearestSample(this.pos, this.prevIndex);
		const tangentHeading = Math.atan2(before.sample.tangent.x, before.sample.tangent.z);

		if (!frozen && !this.finished) {
			this.drive(dt, steer, before, tangentHeading);
		} else {
			this.coast(dt, frozen);
		}

		return {
			near: this.track.nearestSample(this.pos, this.prevIndex),
			railContact: this.touchingRail
		};
	}

	/** One physics step while the race is live: speed, steering, rails, help. */
	private drive(dt: number, steer: number, before: NearestResult, tangentHeading: number): void {
		this.updateInput(dt, steer);
		this.updateSpeed(dt, steer, this.touchingRail);
		this.steerAndMove(dt, steer, tangentHeading);

		const near = this.track.nearestSample(this.pos, before.index);
		this.applyGuardrail(near, tangentHeading);

		const after = this.track.nearestSample(this.pos, near.index);
		if (this.autoSteering) this.followTrack(dt, after, tangentHeading);

		if (this.updateRecovery(dt, after)) {
			this.syncVisual(dt);
			return;
		}

		this.advanceProgress(before, after, dt);
		this.syncVisual(dt);
	}

	/**
	 * Tracks whether the child is driving. Steering hands control back at once;
	 * five quiet seconds hand it to the autopilot, which stays on until the next
	 * steering input. Advanced driving never gets it.
	 */
	private updateInput(dt: number, steer: number): void {
		if (Math.abs(steer) > STEER_INPUT_THRESHOLD) {
			this.idleTime = 0;
			this.autoSteering = false;
			return;
		}
		this.idleTime += dt;
		if (!this.assist) {
			// Advanced driving has no autopilot, even after a long idle.
			this.autoSteering = false;
			return;
		}
		if (!this.autoSteering && this.idleTime >= AUTOPILOT_IDLE_SECONDS) {
			this.autoSteering = true;
		}
	}

	/** Autopilot: align with the road and drift back to the centre. */
	private followTrack(dt: number, after: NearestResult, tangentHeading: number): void {
		this.heading +=
			shortestAngle(tangentHeading - this.heading) * Math.min(1, dt * AUTOPILOT_ALIGN_RATE);
		const pull = Math.min(1, dt * AUTOPILOT_PULL_RATE);
		this.pos.x += after.sample.normal.x * -after.lateral * pull;
		this.pos.z += after.sample.normal.z * -after.lateral * pull;
	}

	private updateSpeed(dt: number, steer: number, railContact: boolean): void {
		const advanced = !this.assist;
		if (advanced && !railContact && Math.abs(steer) < STRAIGHT_STEER) {
			// Long, clean straights let the advanced car creep past 50 km/h.
			this.straightTime = Math.min(ADVANCED_RAMP_SECONDS, this.straightTime + dt);
		} else {
			this.straightTime = 0;
		}
		// Walls bite harder in advanced: the car has to earn its speed back.
		const targetSpeed = targetSpeedFor(
			advanced,
			this.straightTime,
			this.boostTime > 0,
			railContact
		);
		const maxDelta = ACCELERATION * dt;
		const brakeDelta = ACCELERATION * BRAKE_MULTIPLIER * dt;
		if (this.speed < targetSpeed) {
			this.speed = Math.min(targetSpeed, this.speed + maxDelta);
		} else {
			this.speed = Math.max(targetSpeed, this.speed - brakeDelta);
		}
	}

	private steerAndMove(dt: number, steer: number, tangentHeading: number): void {
		const speedFactor = THREE.MathUtils.clamp(this.speed / CRUISE_SPEED, 0, 1);
		const steerRate = THREE.MathUtils.lerp(STEER_LOW, STEER_HIGH, speedFactor);
		// Screen-right is world -X when the camera looks along +Z; flip the
		// heading sign so the on-screen arrows match the car's direction.
		this.heading -= steer * steerRate * dt;
		this.steerVisual += (steer - this.steerVisual) * Math.min(1, dt * 10);

		// No permanent auto-follow. The car only follows the tangent a tiny
		// amount; the real auto-steer assist is earned by hitting a rail.
		this.heading += shortestAngle(tangentHeading - this.heading) * Math.min(1, TANGENT_FOLLOW * dt);

		this.pos.x += Math.sin(this.heading) * this.speed * dt;
		this.pos.z += Math.cos(this.heading) * this.speed * dt;
	}

	private applyGuardrail(near: NearestResult, tangentHeading: number): void {
		if (Math.abs(near.lateral) <= this.track.maxLateral) {
			this.touchingRail = false;
			return;
		}
		const sign = Math.sign(near.lateral) || 1;
		// Keep the car's progress along the tangent; only remove the sideways
		// overshoot. Snapping to the sample centre would pin the car at the rail
		// forever.
		const along =
			(this.pos.x - near.sample.pos.x) * near.sample.tangent.x +
			(this.pos.z - near.sample.pos.z) * near.sample.tangent.z;
		this.pos.x =
			near.sample.pos.x +
			near.sample.tangent.x * along +
			near.sample.normal.x * this.track.maxLateral * sign;
		this.pos.z =
			near.sample.pos.z +
			near.sample.tangent.z * along +
			near.sample.normal.z * this.track.maxLateral * sign;
		// Slide along the rail instead of pinning the car into it.
		this.heading += shortestAngle(tangentHeading - this.heading) * RAIL_SLIDE_ALIGN;
		this.touchingRail = true;
	}

	/** Tracks wrong-way/stuck timers and the last safe spot. True if it recovered. */
	private updateRecovery(dt: number, after: NearestResult): boolean {
		const forwardDot =
			Math.sin(this.heading) * after.sample.tangent.x +
			Math.cos(this.heading) * after.sample.tangent.z;

		if (forwardDot < WRONG_WAY_DOT) this.wrongWayTime += dt;
		else this.wrongWayTime = 0;
		if (this.speed < STUCK_SPEED) this.stuckTime += dt;
		else this.stuckTime = 0;
		this.safeTimer += dt;
		if (
			this.safeTimer > SAFE_SAMPLE_SECONDS &&
			Math.abs(after.lateral) < this.track.maxLateral - SAFE_MARGIN &&
			forwardDot > 0.5
		) {
			this.safePos.copy(this.pos);
			this.safeHeading = this.heading;
			this.safeTimer = 0;
		}
		if (this.wrongWayTime <= WRONG_WAY_SECONDS && this.stuckTime <= STUCK_SECONDS) return false;

		this.recover();
		return true;
	}

	private advanceProgress(before: NearestResult, after: NearestResult, dt: number): void {
		let delta = after.sample.distance - before.sample.distance;
		if (delta < -this.track.length / 2) delta += this.track.length;
		if (delta > this.track.length / 2) delta -= this.track.length;
		this.raceDistance = Math.min(this.track.length * LAPS, this.raceDistance + delta);
		this.lap = Math.min(LAPS, Math.floor(this.raceDistance / this.track.length) + 1);

		if (this.boostTime > 0) this.boostTime = Math.max(0, this.boostTime - dt);
		if (this.raceDistance >= this.track.length * LAPS) this.finished = true;
		this.prevIndex = after.index;
	}

	/** Braking only: during the countdown the car holds still, after the flag it rolls out. */
	private coast(dt: number, frozen: boolean): void {
		this.speed = Math.max(0, this.speed - ACCELERATION * COAST_BRAKE_MULTIPLIER * dt);
		if (!frozen) {
			this.pos.x += Math.sin(this.heading) * this.speed * dt;
			this.pos.z += Math.cos(this.heading) * this.speed * dt;
		}
		this.syncVisual(dt);
	}

	recover(): void {
		this.pos.copy(this.safePos);
		this.heading = this.safeHeading;
		this.speed = 0;
		this.touchingRail = false;
		this.stuckTime = 0;
		this.wrongWayTime = 0;
		this.safeTimer = 0;
		this.prevIndex = this.track.nearestSample(this.pos).index;
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
		this.visual.wheelAngle -= (this.speed / WHEEL_RADIUS) * dt;
		setWheelAngle(this.visual.wheels, this.visual.wheelAngle);
	}
}
