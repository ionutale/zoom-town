import * as THREE from 'three';
import type { PlayerCar } from './car';
import { sampleAt, type NearestResult } from './track';

export class ChaseCamera {
	camera: THREE.PerspectiveCamera;
	mode: 'attract' | 'chase' = 'attract';
	calm = false;
	private targetPos = new THREE.Vector3();
	private targetLook = new THREE.Vector3();
	private currentLook = new THREE.Vector3();
	private orbit = 0;

	constructor(aspect: number) {
		this.camera = new THREE.PerspectiveCamera(68, aspect, 0.1, 220);
		this.camera.position.set(0, 10, 24);
		this.camera.lookAt(0, 0, 0);
		this.resetAttract();
	}

	resetAttract(): void {
		this.mode = 'attract';
		this.orbit = 0.6;
		const center = sampleAt(0.01).pos;
		this.targetPos.set(
			center.x + Math.sin(this.orbit) * 19,
			10,
			center.z + Math.cos(this.orbit) * 19
		);
		this.targetLook.set(center.x, 1.2, center.z);
		this.currentLook.copy(this.targetLook);
		this.camera.position.copy(this.targetPos);
		this.camera.lookAt(this.currentLook);
	}

	setChase(car: PlayerCar, near: NearestResult): void {
		this.mode = 'chase';
		const s = near.sample;
		this.camera.position.set(car.pos.x - s.tangent.x * 8.5, 4.8, car.pos.z - s.tangent.z * 8.5);
		this.currentLook.set(car.pos.x + s.tangent.x * 9, 1.25, car.pos.z + s.tangent.z * 9);
		this.camera.lookAt(this.currentLook);
	}

	update(dt: number, car: PlayerCar | null, near: NearestResult | null, boosting: boolean): void {
		if (this.mode === 'attract') {
			this.orbit += dt * 0.12;
			const center = sampleAt(0.01).pos;
			this.targetPos.set(
				center.x + Math.sin(this.orbit) * 19,
				9.5,
				center.z + Math.cos(this.orbit) * 19
			);
			this.targetLook.set(center.x, 1.2, center.z);
			const alpha = 1 - Math.exp(-2.4 * dt);
			this.camera.position.lerp(this.targetPos, alpha);
			this.currentLook.lerp(this.targetLook, alpha);
			this.camera.lookAt(this.currentLook);
			this.lerpFov(dt, 62);
			return;
		}

		if (!car || !near) return;
		const s = near.sample;
		const lookAhead = this.calm ? 5 : 10;
		this.targetPos.set(car.pos.x - s.tangent.x * 8.5, 4.8, car.pos.z - s.tangent.z * 8.5);
		this.targetLook.set(
			car.pos.x + s.tangent.x * lookAhead,
			1.25,
			car.pos.z + s.tangent.z * lookAhead
		);

		const posAlpha = 1 - Math.exp(-5.5 * dt);
		const lookAlpha = 1 - Math.exp(-7 * dt);
		this.camera.position.lerp(this.targetPos, posAlpha);
		this.currentLook.lerp(this.targetLook, lookAlpha);
		this.camera.lookAt(this.currentLook);
		this.lerpFov(dt, boosting && !this.calm ? 71 : this.calm ? 65 : 68);
	}

	private lerpFov(dt: number, target: number): void {
		this.camera.fov += (target - this.camera.fov) * Math.min(1, dt * 4);
		this.camera.updateProjectionMatrix();
	}

	resize(aspect: number): void {
		this.camera.aspect = aspect;
		this.camera.updateProjectionMatrix();
	}
}
