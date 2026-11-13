import * as THREE from 'three';
import { markSharedResource } from './dispose';
import { mergeMeshesByMaterial } from './merge';
import { LAPS } from './rules';
import { COLORS } from './palette';
import type { Track } from './track';

const BALLOON_TS = [0.06, 0.24, 0.42, 0.6, 0.78];
const BALLOON_LANES = [-1.4, 0, 1.4, 0, -1.4];
const BALLOON_COLORS = [COLORS.red, COLORS.yellow, COLORS.blue, COLORS.pink, COLORS.teal];
/** How close the car must pass to pop a balloon. */
const PICKUP_RADIUS = 1.95;

export interface BalloonItem {
	group: THREE.Group;
	t: number;
	lane: number;
	lap: number;
	collected: boolean;
	phase: number;
	color: number;
}

export interface BalloonPickup {
	position: THREE.Vector3;
	color: number;
}

const balloonGeometry = new THREE.SphereGeometry(0.42, 14, 12);
const bandGeometry = new THREE.TorusGeometry(0.43, 0.045, 6, 18);
const stringGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.55, 5);
const knotGeometry = new THREE.ConeGeometry(0.09, 0.16, 6);
const highlightGeometry = new THREE.SphereGeometry(0.1, 8, 6);

const stringMaterial = new THREE.MeshBasicMaterial({ color: COLORS.cream });
const bandMaterial = new THREE.MeshBasicMaterial({ color: COLORS.white });
const highlightMaterial = new THREE.MeshBasicMaterial({ color: COLORS.white });

// Balloon trim is shared by all fifteen balloons, so it must survive a single
// balloon group being rebuilt for another circuit.
markSharedResource(
	balloonGeometry,
	bandGeometry,
	stringGeometry,
	knotGeometry,
	highlightGeometry,
	stringMaterial,
	bandMaterial,
	highlightMaterial
);

export class Balloons {
	items: BalloonItem[] = [];
	collectedTotal = 0;
	time = 0;
	currentLap = 1;
	readonly root = new THREE.Group();
	track: Track;

	constructor(track: Track) {
		this.track = track;
		for (let lap = 1; lap <= LAPS; lap++) {
			for (let i = 0; i < BALLOON_TS.length; i++) {
				const color = BALLOON_COLORS[i % BALLOON_COLORS.length];
				const group = new THREE.Group();
				const parts: THREE.Mesh[] = [];
				const body = new THREE.Mesh(
					balloonGeometry,
					new THREE.MeshLambertMaterial({
						color,
						flatShading: true,
						emissive: color,
						emissiveIntensity: 0.28
					})
				);
				body.scale.set(1, 1.16, 1);
				parts.push(body);

				const band = new THREE.Mesh(bandGeometry, bandMaterial);
				band.rotation.x = Math.PI / 2;
				band.scale.set(1, 1, 0.32);
				band.position.y = 0.05;
				parts.push(band);

				const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
				highlight.position.set(-0.14, 0.18, 0.3);
				highlight.scale.set(1, 1.3, 0.6);
				parts.push(highlight);

				const knot = new THREE.Mesh(knotGeometry, bandMaterial);
				knot.position.y = -0.48;
				knot.rotation.x = Math.PI;
				parts.push(knot);

				const string = new THREE.Mesh(stringGeometry, stringMaterial);
				string.position.y = -0.78;
				parts.push(string);

				group.add(...mergeMeshesByMaterial(parts));

				this.items.push({
					group,
					t: BALLOON_TS[i],
					lane: BALLOON_LANES[i],
					lap,
					collected: false,
					phase: i * 0.7 + lap * 0.35,
					color
				});
				this.root.add(group);
			}
		}
		this.reset();
	}

	reset(): void {
		this.collectedTotal = 0;
		this.time = 0;
		this.currentLap = 1;
		for (const item of this.items) {
			item.collected = false;
			item.group.visible = item.lap === 1;
			this.place(item);
		}
	}

	setLap(lap: number): void {
		this.currentLap = lap;
		for (const item of this.items) {
			item.group.visible = item.lap === lap && !item.collected;
		}
	}

	/** Debug helper: marks exactly `total` balloons as collected. */
	forceCollect(total: number): void {
		const target = Math.max(0, Math.min(this.items.length, Math.round(total)));
		this.collectedTotal = target;
		let collected = 0;
		for (const item of this.items) {
			const take = collected < target;
			item.collected = take;
			item.group.visible = !take && item.lap === this.currentLap;
			if (take) collected++;
		}
	}

	place(item: BalloonItem): void {
		const s = this.track.sampleAt(item.t);
		item.group.position.set(
			s.pos.x + s.normal.x * item.lane,
			1.35,
			s.pos.z + s.normal.z * item.lane
		);
	}

	update(dt: number, playerPos: THREE.Vector3, lap: number): BalloonPickup[] {
		this.time += dt;
		const pickups: BalloonPickup[] = [];
		for (const item of this.items) {
			if (item.lap !== lap || item.collected) continue;
			this.place(item);
			item.group.position.y = 1.35 + Math.sin(this.time * 2.4 + item.phase) * 0.14;
			item.group.rotation.y = Math.sin(this.time * 0.9 + item.phase) * 0.25;
			const dx = playerPos.x - item.group.position.x;
			const dz = playerPos.z - item.group.position.z;
			if (dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS) {
				item.collected = true;
				item.group.visible = false;
				this.collectedTotal++;
				pickups.push({
					position: item.group.position.clone(),
					color: item.color
				});
			}
		}
		return pickups;
	}
}
