import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeMeshesByMaterial } from './merge';
import { COLORS } from './palette';
import type { Track, TrackTheme } from './track';

/**
 * Small decorative props that make the circuits feel lived in: bushes, benches,
 * bird flocks, and one signature prop set per world. Everything is instanced or
 * merged by material so the whole module costs roughly ten draw calls.
 */

type Rand = () => number;
type NearStart = (x: number, z: number, radius: number) => boolean;

const sceneryPoint = new THREE.Vector3();

function offTrack(track: Track, x: number, z: number, clearance: number): boolean {
	return track.isFartherThan(sceneryPoint.set(x, 0, z), track.halfWidth + clearance);
}

function at(track: Track, t: number, lateral: number): { pos: THREE.Vector3; yaw: number } {
	const sample = track.sampleAt(t);
	return {
		pos: sample.pos.clone().addScaledVector(sample.normal, lateral),
		yaw: Math.atan2(sample.tangent.x, sample.tangent.z)
	};
}

function box(
	width: number,
	height: number,
	depth: number,
	color: number,
	x: number,
	y: number,
	z: number
): THREE.Mesh {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(width, height, depth),
		new THREE.MeshLambertMaterial({ color })
	);
	mesh.position.set(x, y, z);
	return mesh;
}

/** Bakes local part transforms plus a world placement into plain meshes. */
function worldParts(parts: THREE.Mesh[], position: THREE.Vector3, yaw: number): THREE.Mesh[] {
	const placement = new THREE.Matrix4().makeRotationY(yaw).setPosition(position);
	return parts.map((mesh) => {
		mesh.updateMatrix();
		const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix).applyMatrix4(placement);
		return new THREE.Mesh(geometry, mesh.material as THREE.Material);
	});
}

function addMerged(group: THREE.Group, parts: THREE.Mesh[]) {
	for (const mesh of mergeMeshesByMaterial(parts)) group.add(mesh);
}

export function buildDecorations(
	track: Track,
	theme: TrackTheme,
	rand: Rand,
	nearStart: NearStart
): THREE.Group {
	const group = new THREE.Group();
	group.name = 'decorations';
	group.add(buildBushes(track, theme, rand, nearStart));
	group.add(buildBenches(track));
	group.add(buildBirdFlocks(track));

	switch (track.def.id) {
		case 'sunny-town':
			group.add(buildMarketStall(track));
			break;
		case 'park-loop':
			group.add(buildPicnicTables(track));
			break;
		case 'harbor-dash':
			group.add(buildHarborCrates(track));
			break;
		case 'dino-valley':
			group.add(buildDinoNests(track));
			break;
		case 'candy-hills':
			group.add(buildMarshmallowPiles(track));
			break;
	}
	return group;
}

/* ------------------------------------------------------------------ */
/* Universal                                                           */
/* ------------------------------------------------------------------ */

function buildBushes(
	track: Track,
	theme: TrackTheme,
	rand: Rand,
	nearStart: NearStart
): THREE.Group {
	const group = new THREE.Group();
	const positions: { x: number; z: number; s: number; tone: number }[] = [];
	for (let i = 0; i < 90 && positions.length < 46; i++) {
		const x = (rand() - 0.5) * 150;
		const z = (rand() - 0.5) * 150;
		if (!offTrack(track, x, z, 2.6) || nearStart(x, z, 17)) continue;
		positions.push({ x, z, s: 0.7 + rand() * 0.8, tone: rand() });
	}

	const geometry = new THREE.IcosahedronGeometry(0.8, 0);
	const material = new THREE.MeshLambertMaterial({ color: theme.tree2, flatShading: true });
	const bushes = new THREE.InstancedMesh(geometry, material, positions.length);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	const dark = new THREE.Color(theme.tree2).multiplyScalar(0.9);
	const light = new THREE.Color(theme.tree2).multiplyScalar(1.08);

	positions.forEach((bush, i) => {
		// Slight rotation per bush so the low-poly faces do not line up.
		quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), bush.tone * Math.PI);
		matrix.compose(
			new THREE.Vector3(bush.x, 0.45 * bush.s, bush.z),
			quat,
			new THREE.Vector3(bush.s * 1.2, bush.s * 0.66, bush.s)
		);
		bushes.setMatrixAt(i, matrix);
		bushes.setColorAt(i, bush.tone > 0.6 ? dark : light);
	});
	bushes.instanceMatrix.needsUpdate = true;
	if (bushes.instanceColor) bushes.instanceColor.needsUpdate = true;
	group.add(bushes);
	return group;
}

function benchGeometry(): THREE.BufferGeometry {
	const parts = [
		new THREE.BoxGeometry(2.3, 0.14, 0.72).translate(0, 0.92, 0),
		new THREE.BoxGeometry(2.3, 0.52, 0.12).translate(0, 1.26, -0.36),
		new THREE.BoxGeometry(0.16, 0.86, 0.64).translate(-0.98, 0.43, 0),
		new THREE.BoxGeometry(0.16, 0.86, 0.64).translate(0.98, 0.43, 0)
	];
	return mergeGeometries(parts) ?? parts[0];
}

function buildBenches(track: Track): THREE.Group {
	const group = new THREE.Group();
	const count = 7;
	const benches = new THREE.InstancedMesh(
		benchGeometry(),
		new THREE.MeshLambertMaterial({ color: COLORS.wood }),
		count
	);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	const up = new THREE.Vector3(0, 1, 0);
	for (let i = 0; i < count; i++) {
		const t = 0.1 + (i / count) * 0.82;
		const side = i % 2 === 0 ? 1 : -1;
		const sample = track.sampleAt(t);
		const pos = sample.pos.clone().addScaledVector(sample.normal, (track.halfWidth + 2.9) * side);
		// The bench faces +Z, so point it at the road.
		const facing = sample.normal.clone().multiplyScalar(-side);
		quat.setFromAxisAngle(up, Math.atan2(facing.x, facing.z));
		matrix.compose(pos, quat, new THREE.Vector3(1, 1, 1));
		benches.setMatrixAt(i, matrix);
	}
	benches.instanceMatrix.needsUpdate = true;
	group.add(benches);
	return group;
}

function buildBirdFlocks(track: Track): THREE.Group {
	const group = new THREE.Group();
	const material = new THREE.MeshLambertMaterial({ color: COLORS.ink });
	const anchors = [0.1, 0.45, 0.75];
	const flocks: THREE.Vector3[] = anchors.map((t, i) =>
		track.pointAt(t, i % 2 === 0 ? -6 : 7, 0).setY(10 + i * 1.6)
	);
	const offsets: [number, number][] = [
		[0, 0],
		[2.6, -1.8],
		[-2.6, -1.8],
		[5.2, -3.6]
	];
	const parts: THREE.Mesh[] = [];
	for (const flock of flocks) {
		for (const [ox, oz] of offsets) {
			const bird = new THREE.Group();
			const wing = new THREE.BoxGeometry(1.35, 0.07, 0.3);
			const left = new THREE.Mesh(wing, material);
			left.position.set(-0.72, 0, 0);
			left.rotation.z = 0.28;
			const right = new THREE.Mesh(wing, material);
			right.position.set(0.72, 0, 0);
			right.rotation.z = -0.28;
			bird.add(left, right);
			bird.position.set(flock.x + ox, flock.y + Math.abs(ox) * 0.25, flock.z + oz);
			bird.rotation.y = 0.6;
			bird.updateMatrixWorld(true);
			bird.traverse((child) => {
				if (!(child instanceof THREE.Mesh)) return;
				child.updateMatrix();
				const geometry = child.geometry
					.clone()
					.applyMatrix4(child.matrix)
					.applyMatrix4(bird.matrix);
				parts.push(new THREE.Mesh(geometry, material));
			});
		}
	}
	for (const mesh of mergeMeshesByMaterial(parts)) {
		mesh.frustumCulled = false;
		group.add(mesh);
	}
	return group;
}

/* ------------------------------------------------------------------ */
/* Theme props                                                         */
/* ------------------------------------------------------------------ */

function buildMarketStall(track: Track): THREE.Group {
	const group = new THREE.Group();
	const { pos, yaw } = at(track, 0.19, -16);
	const parts: THREE.Mesh[] = [
		box(4.2, 1.0, 1.6, COLORS.cream2, 0, 0.5, 0),
		box(0.14, 2.6, 0.14, COLORS.wood, -1.9, 1.3, -0.6),
		box(0.14, 2.6, 0.14, COLORS.wood, 1.9, 1.3, -0.6),
		box(0.14, 2.6, 0.14, COLORS.wood, -1.9, 1.3, 0.6),
		box(0.14, 2.6, 0.14, COLORS.wood, 1.9, 1.3, 0.6)
	];
	for (let i = 0; i < 4; i++) {
		parts.push(
			box(1.1, 0.12, 2.1, i % 2 === 0 ? COLORS.red : COLORS.cream, -1.65 + i * 1.1, 2.68, 0.05)
		);
	}
	parts.push(
		box(0.8, 0.5, 0.7, COLORS.orange, -1.1, 1.25, 0.1),
		box(0.7, 0.4, 0.6, COLORS.yellow, 0.1, 1.2, 0.15),
		box(0.9, 0.35, 0.5, COLORS.teal, 1.2, 1.17, 0.1)
	);
	addMerged(group, worldParts(parts, pos, yaw));
	return group;
}

function buildPicnicTables(track: Track): THREE.Group {
	const group = new THREE.Group();
	const spots: [number, number][] = [
		[0.24, 10],
		[0.58, -11],
		[0.83, 9]
	];
	const all: THREE.Mesh[] = [];
	for (const [t, lateral] of spots) {
		const { pos, yaw } = at(track, t, lateral);
		const parts: THREE.Mesh[] = [
			box(2.4, 0.16, 1.1, COLORS.cream2, 0, 0.78, 0),
			box(2.4, 0.14, 0.42, COLORS.wood, 0, 0.46, 0.95),
			box(2.4, 0.14, 0.42, COLORS.wood, 0, 0.46, -0.95),
			box(0.16, 0.78, 0.9, COLORS.cream2, -0.95, 0.39, 0),
			box(0.16, 0.78, 0.9, COLORS.cream2, 0.95, 0.39, 0)
		];
		all.push(...worldParts(parts, pos, yaw));
	}
	addMerged(group, all);
	return group;
}

function buildHarborCrates(track: Track): THREE.Group {
	const group = new THREE.Group();
	const { pos, yaw } = at(track, 0.07, 17);
	const parts: THREE.Mesh[] = [
		box(1.4, 1.1, 1.4, COLORS.wood, -1.2, 0.55, 0),
		box(1.1, 0.9, 1.1, COLORS.wood, 0.4, 0.45, 0.8),
		box(1.2, 1.0, 1.2, COLORS.cream2, 0.6, 0.5, -0.9),
		box(0.9, 0.8, 0.9, COLORS.wood, 1.9, 0.4, 0.3)
	];
	for (let i = 0; i < 3; i++) {
		const barrel = new THREE.Mesh(
			new THREE.CylinderGeometry(0.42, 0.42, 1.0, 10),
			new THREE.MeshLambertMaterial({ color: COLORS.orange })
		);
		barrel.position.set(-2.8 - i * 0.95, 0.5, 1.4 - i * 0.3);
		parts.push(barrel);
	}
	addMerged(group, worldParts(parts, pos, yaw));
	return group;
}

function buildDinoNests(track: Track): THREE.Group {
	const group = new THREE.Group();
	const spots: [number, number][] = [
		[0.22, 12],
		[0.55, -13],
		[0.79, 11]
	];
	const all: THREE.Mesh[] = [];
	for (const [t, lateral] of spots) {
		const { pos, yaw } = at(track, t, lateral);
		const parts: THREE.Mesh[] = [];
		const rim = new THREE.Mesh(
			new THREE.TorusGeometry(1.1, 0.28, 6, 12),
			new THREE.MeshLambertMaterial({ color: COLORS.wood })
		);
		rim.rotation.x = -Math.PI / 2;
		rim.position.y = 0.22;
		parts.push(rim);
		for (let i = 0; i < 3; i++) {
			const egg = new THREE.Mesh(
				new THREE.SphereGeometry(0.3, 8, 6),
				new THREE.MeshLambertMaterial({ color: COLORS.cream })
			);
			egg.scale.set(1, 1.35, 1);
			egg.position.set(
				Math.cos((i / 3) * Math.PI * 2) * 0.42,
				0.5,
				Math.sin((i / 3) * Math.PI * 2) * 0.42
			);
			parts.push(egg);
		}
		all.push(...worldParts(parts, pos, yaw));
	}
	addMerged(group, all);
	return group;
}

function buildMarshmallowPiles(track: Track): THREE.Group {
	const group = new THREE.Group();
	const spots: [number, number][] = [
		[0.18, 13],
		[0.46, -12],
		[0.72, 10],
		[0.9, -14]
	];
	const all: THREE.Mesh[] = [];
	for (const [t, lateral] of spots) {
		const { pos, yaw } = at(track, t, lateral);
		const parts: THREE.Mesh[] = [];
		const colors = [COLORS.cream, COLORS.pink, COLORS.cream2];
		for (let i = 0; i < 3; i++) {
			const puff = new THREE.Mesh(
				new THREE.SphereGeometry(0.42 - i * 0.05, 8, 6),
				new THREE.MeshLambertMaterial({ color: colors[i] })
			);
			puff.position.set((i - 1) * 0.5, 0.36, (i % 2) * 0.24);
			parts.push(puff);
		}
		all.push(...worldParts(parts, pos, yaw));
	}
	addMerged(group, all);
	return group;
}
