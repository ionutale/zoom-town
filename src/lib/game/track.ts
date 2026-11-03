import * as THREE from 'three';
import { buildDecorations } from './decorations';
import { mergeMeshesByMaterial } from './merge';
import { COLORS } from './palette';

export const TRACK_WIDTH = 8;
export const SAMPLE_COUNT = 720;

export type TrackId = 'sunny-town' | 'park-loop' | 'harbor-dash' | 'dino-valley' | 'candy-hills';
export type ThemeId = 'sunny' | 'park' | 'harbor' | 'dino' | 'candy';

export interface TrackTheme {
	sky: number;
	ground: number;
	ground2: number;
	road: number;
	tree: number;
	tree2: number;
	roofs: number[];
	accent: number;
	accent2: number;
	water: number;
}

export interface TrackDef {
	id: TrackId;
	name: string;
	points: [number, number][];
	theme: ThemeId;
	seed: number;
}

export const TRACK_DEFS: readonly TrackDef[] = [
	{
		id: 'sunny-town',
		name: 'Sunny Town',
		theme: 'sunny',
		seed: 20261031,
		points: [
			[-76, 58],
			[-48, 60],
			[-24, 54],
			[-2, 60],
			[18, 54],
			[44, 48],
			[64, 38],
			[78, 24],
			[82, 6],
			[76, -12],
			[62, -26],
			[44, -34],
			[24, -32],
			[8, -38],
			[-6, -50],
			[-24, -54],
			[-40, -46],
			[-50, -30],
			[-54, -10],
			[-66, 2],
			[-78, 16]
		]
	},
	{
		id: 'park-loop',
		name: 'Park Loop',
		theme: 'park',
		seed: 7712,
		points: [
			[-70, 40],
			[-40, 52],
			[-5, 50],
			[25, 40],
			[48, 22],
			[56, -2],
			[46, -26],
			[24, -40],
			[-4, -42],
			[-32, -34],
			[-52, -16],
			[-62, 8]
		]
	},
	{
		id: 'harbor-dash',
		name: 'Harbor Dash',
		theme: 'harbor',
		seed: 1904,
		points: [
			[-80, 40],
			[-40, 42],
			[0, 40],
			[40, 38],
			[70, 28],
			[82, 10],
			[76, -10],
			[58, -24],
			[34, -30],
			[10, -26],
			[-8, -34],
			[-30, -44],
			[-52, -42],
			[-70, -30],
			[-80, -10]
		]
	},
	{
		id: 'dino-valley',
		name: 'Dino Valley',
		theme: 'dino',
		seed: 6606,
		points: [
			[-74, 46],
			[-44, 52],
			[-16, 44],
			[8, 50],
			[30, 44],
			[52, 30],
			[62, 10],
			[56, -8],
			[40, -18],
			[20, -16],
			[4, -24],
			[-12, -40],
			[-32, -46],
			[-52, -38],
			[-66, -22],
			[-72, -2]
		]
	},
	{
		id: 'candy-hills',
		name: 'Candy Hills',
		theme: 'candy',
		seed: 3301,
		points: [
			[-78, 34],
			[-52, 48],
			[-24, 44],
			[2, 52],
			[28, 46],
			[50, 34],
			[64, 16],
			[58, -2],
			[44, -12],
			[24, -10],
			[8, -20],
			[-10, -32],
			[-32, -36],
			[-52, -28],
			[-66, -12]
		]
	}
] as const;

export const THEMES: Record<ThemeId, TrackTheme> = {
	sunny: {
		sky: 0x7ec8f2,
		ground: 0x7cc242,
		ground2: 0x4e8f2a,
		road: 0x6b6f76,
		tree: 0x4e8f2a,
		tree2: 0x7cc242,
		roofs: [COLORS.red, COLORS.blue, COLORS.teal, COLORS.orange],
		accent: COLORS.yellow,
		accent2: COLORS.teal,
		water: COLORS.water
	},
	park: {
		sky: 0x86d3ef,
		ground: 0x88c94c,
		ground2: 0x4f8c38,
		road: 0x6b6f76,
		tree: 0x3f8f3a,
		tree2: 0x6fbd4f,
		roofs: [COLORS.teal, COLORS.blue, COLORS.orange, COLORS.cream],
		accent: COLORS.teal,
		accent2: COLORS.yellow,
		water: COLORS.water
	},
	harbor: {
		sky: 0x71cbea,
		ground: 0xd9c48a,
		ground2: 0x8abd55,
		road: 0x686d74,
		tree: 0x4e8f2a,
		tree2: 0x7cc242,
		roofs: [COLORS.blue, COLORS.cream, COLORS.red, COLORS.teal],
		accent: COLORS.water,
		accent2: COLORS.yellow,
		water: 0x3faed4
	},
	dino: {
		sky: 0xf0c58c,
		ground: 0x7fae4a,
		ground2: 0x4f7e32,
		road: 0x6d6961,
		tree: 0x2f7a3a,
		tree2: 0x5c9b3f,
		roofs: [COLORS.orange, COLORS.red, COLORS.wood, COLORS.cream],
		accent: COLORS.orange,
		accent2: COLORS.red,
		water: COLORS.water
	},
	candy: {
		sky: 0xf3b6d2,
		ground: 0xa8d96b,
		ground2: 0x6aa848,
		road: 0x74707c,
		tree: 0x7cc242,
		tree2: 0xa8d96b,
		roofs: [COLORS.pink, COLORS.red, COLORS.teal, COLORS.yellow],
		accent: COLORS.pink,
		accent2: COLORS.yellow,
		water: 0x7fd6e8
	}
};

export interface TrackSample {
	pos: THREE.Vector3;
	tangent: THREE.Vector3;
	normal: THREE.Vector3;
	t: number;
	distance: number;
	index: number;
}

export interface NearestResult {
	index: number;
	sample: TrackSample;
	lateral: number;
	centerDistance: number;
}

export class Track {
	readonly def: TrackDef;
	readonly theme: TrackTheme;
	readonly curve: THREE.CatmullRomCurve3;
	readonly samples: TrackSample[];
	readonly length: number;
	readonly width = TRACK_WIDTH;
	readonly halfWidth = TRACK_WIDTH / 2;
	readonly maxLateral = TRACK_WIDTH / 2 - 0.9;
	readonly startT = 0;
	readonly startLineT = 0.04;

	constructor(def: TrackDef) {
		this.def = def;
		this.theme = THEMES[def.theme];
		this.curve = new THREE.CatmullRomCurve3(
			def.points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
			true,
			'catmullrom',
			0.5
		);
		this.curve.arcLengthDivisions = 2400;
		this.length = this.curve.getLength();
		this.samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
			const t = index / SAMPLE_COUNT;
			const pos = this.curve.getPointAt(t);
			const tangent = this.curve.getTangentAt(t).normalize();
			const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
			return { pos, tangent, normal, t, distance: t * this.length, index };
		});
	}

	sampleAt(t: number): TrackSample {
		const u = ((t % 1) + 1) % 1;
		return this.interpolate(u, u * this.length);
	}

	sampleAtDistance(distance: number): TrackSample {
		const u = (((distance / this.length) % 1) + 1) % 1;
		return this.interpolate(u, distance);
	}

	pointAt(t: number, lateral = 0, forward = 0): THREE.Vector3 {
		const s = this.sampleAt(t);
		return s.pos
			.clone()
			.addScaledVector(s.normal, lateral)
			.addScaledVector(s.tangent, forward);
	}

	nearestSample(point: THREE.Vector3, hintIndex?: number): NearestResult {
		const window = hintIndex === undefined ? SAMPLE_COUNT : 48;
		const start = hintIndex === undefined ? 0 : hintIndex - window / 2;
		let best = -1;
		let bestDist = Infinity;
		for (let k = 0; k < window; k++) {
			const i = (((start + k) % SAMPLE_COUNT) + SAMPLE_COUNT) % SAMPLE_COUNT;
			const s = this.samples[i];
			const dx = point.x - s.pos.x;
			const dz = point.z - s.pos.z;
			const d = dx * dx + dz * dz;
			if (d < bestDist) {
				bestDist = d;
				best = i;
			}
		}
		const sample = this.samples[best];
		const lateral =
			(point.x - sample.pos.x) * sample.normal.x +
			(point.z - sample.pos.z) * sample.normal.z;
		return { index: best, sample, lateral, centerDistance: Math.sqrt(bestDist) };
	}

	distanceFromTrack(point: THREE.Vector3): number {
		return this.nearestSample(point).centerDistance;
	}

	private interpolate(u: number, rawDistance: number): TrackSample {
		const raw = u * SAMPLE_COUNT;
		const index = Math.floor(raw) % SAMPLE_COUNT;
		const next = (index + 1) % SAMPLE_COUNT;
		const fraction = raw - Math.floor(raw);
		const a = this.samples[index];
		const b = this.samples[next];
		const pos = a.pos.clone().lerp(b.pos, fraction);
		const tangent = a.tangent.clone().lerp(b.tangent, fraction).normalize();
		const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
		return { pos, tangent, normal, t: u, distance: rawDistance, index };
	}
}

export const TRACKS = TRACK_DEFS.map((def) => new Track(def));

export function getTrack(id: TrackId): Track {
	return TRACKS.find((track) => track.def.id === id) ?? TRACKS[0];
}

export const DEFAULT_TRACK_ID: TrackId = 'sunny-town';

/* ------------------------------------------------------------------ */
/* Track mesh                                                          */
/* ------------------------------------------------------------------ */

function ribbon(
	samplesToUse: TrackSample[],
	offset: number,
	width: number,
	y: number
): THREE.BufferGeometry {
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	const count = samplesToUse.length;

	for (let i = 0; i <= count; i++) {
		const s = samplesToUse[i % count];
		const outer = offset + width / 2;
		const inner = offset - width / 2;
		positions.push(
			s.pos.x + s.normal.x * outer,
			y,
			s.pos.z + s.normal.z * outer,
			s.pos.x + s.normal.x * inner,
			y,
			s.pos.z + s.normal.z * inner
		);
		const v = i / count;
		uvs.push(0, v, 1, v);
		if (i < count) {
			const a = i * 2;
			indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
		}
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

function ribbonMesh(
	track: Track,
	offset: number,
	width: number,
	color: number,
	y: number,
	lit = true
): THREE.Mesh {
	const geometry = ribbon(track.samples, offset, width, y);
	const material = lit
		? new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
		: new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
	return new THREE.Mesh(geometry, material);
}

export function buildTrackGroup(track: Track): THREE.Group {
	const group = new THREE.Group();
	group.name = 'track';

	group.add(ribbonMesh(track, 0, track.width, track.theme.road, 0));
	group.add(
		ribbonMesh(track, track.halfWidth - 0.28, 0.18, COLORS.cream, 0.025, false)
	);
	group.add(
		ribbonMesh(track, -track.halfWidth + 0.28, 0.18, COLORS.cream, 0.025, false)
	);

	const dashGeometry = new THREE.BoxGeometry(0.12, 0.02, 1.15);
	const dashMaterial = new THREE.MeshBasicMaterial({ color: COLORS.cream });
	const dashCount = Math.floor(track.length / 6);
	const dashes = new THREE.InstancedMesh(dashGeometry, dashMaterial, dashCount);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	const up = new THREE.Vector3(0, 1, 0);
	for (let i = 0; i < dashCount; i++) {
		const s = track.sampleAtDistance(i * 6 + 2);
		quat.setFromAxisAngle(up, Math.atan2(s.tangent.x, s.tangent.z));
		matrix.compose(new THREE.Vector3(s.pos.x, 0.03, s.pos.z), quat, new THREE.Vector3(1, 1, 1));
		dashes.setMatrixAt(i, matrix);
	}
	dashes.instanceMatrix.needsUpdate = true;
	group.add(dashes);

	const curbCount = Math.ceil(track.length / 3.4);
	const curbGeometry = new THREE.BoxGeometry(0.5, 0.18, 1.7);
	const redCurbs = new THREE.InstancedMesh(
		curbGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.red }),
		curbCount
	);
	const creamCurbs = new THREE.InstancedMesh(
		curbGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.cream }),
		curbCount
	);
	let redIndex = 0;
	let creamIndex = 0;
	for (let i = 0; i < curbCount; i++) {
		const s = track.sampleAtDistance(i * 3.4);
		quat.setFromAxisAngle(up, Math.atan2(s.tangent.x, s.tangent.z));
		for (const side of [-1, 1]) {
			const p = new THREE.Vector3(
				s.pos.x + s.normal.x * (track.halfWidth - 0.22) * side,
				0.09,
				s.pos.z + s.normal.z * (track.halfWidth - 0.22) * side
			);
			matrix.compose(p, quat, new THREE.Vector3(1, 1, 1));
			const target = (i + (side === 1 ? 1 : 0)) % 2 === 0 ? redCurbs : creamCurbs;
			const index = target === redCurbs ? redIndex++ : creamIndex++;
			target.setMatrixAt(index, matrix);
		}
	}
	redCurbs.count = redIndex;
	creamCurbs.count = creamIndex;
	redCurbs.instanceMatrix.needsUpdate = true;
	creamCurbs.instanceMatrix.needsUpdate = true;
	group.add(redCurbs, creamCurbs);

	const start = track.sampleAt(track.startLineT);
	const checker = new THREE.Group();
	const tiles: THREE.Mesh[] = [];
	for (let i = 0; i < 8; i++) {
		const across = -track.halfWidth + 0.5 + i;
		const tile = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 0.025, 1.4),
			new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? COLORS.ink : COLORS.cream })
		);
		tile.position.set(
			start.pos.x + start.normal.x * across,
			0.04,
			start.pos.z + start.normal.z * across
		);
		tile.rotation.y = Math.atan2(start.tangent.x, start.tangent.z);
		tiles.push(tile);
	}
	checker.add(...mergeMeshesByMaterial(tiles));
	group.add(checker);
	group.add(buildGantry(track));
	return group;
}

function buildGantry(track: Track): THREE.Group {
	const gantry = new THREE.Group();
	const s = track.sampleAt(track.startLineT);
	gantry.position.copy(s.pos);
	gantry.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);

	const postMaterial = new THREE.MeshLambertMaterial({ color: COLORS.cream });
	const stripeMaterial = new THREE.MeshLambertMaterial({ color: COLORS.red });
	const parts: THREE.Mesh[] = [];
	for (const side of [-1, 1]) {
		const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 5.8, 0.38), postMaterial);
		post.position.set(side * (track.halfWidth + 0.6), 2.9, 0);
		parts.push(post);
		const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), stripeMaterial);
		stripe.position.set(side * (track.halfWidth + 0.6), 3.5, 0);
		parts.push(stripe);
	}
	const beam = new THREE.Mesh(
		new THREE.BoxGeometry(track.width + 2.6, 0.72, 0.7),
		postMaterial
	);
	beam.position.y = 5.55;
	parts.push(beam);
	const stripe = new THREE.Mesh(
		new THREE.BoxGeometry(track.width + 2.6, 0.22, 0.74),
		stripeMaterial
	);
	stripe.position.y = 5.55;
	parts.push(stripe);
	for (const x of [-3, 0, 3]) {
		const lamp = new THREE.Mesh(
			new THREE.SphereGeometry(0.34, 12, 10),
			new THREE.MeshBasicMaterial({ color: COLORS.gold })
		);
		lamp.position.set(x, 5.9, 0.1);
		parts.push(lamp);
	}
	gantry.add(...mergeMeshesByMaterial(parts));
	return gantry;
}

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */

function seeded(seed: number): () => number {
	let value = seed;
	return () => {
		value = (value * 1664525 + 1013904223) % 4294967296;
		return value / 4294967296;
	};
}

function outsideTrack(track: Track, x: number, z: number, clearance = 5): boolean {
	return track.distanceFromTrack(new THREE.Vector3(x, 0, z)) > track.halfWidth + clearance;
}

export function buildSceneryGroup(track: Track): THREE.Group {
	const group = new THREE.Group();
	group.name = 'scenery';
	const theme = track.theme;

	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry(300, 300, 1, 1),
		new THREE.MeshLambertMaterial({ color: theme.ground })
	);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = -0.06;
	group.add(ground);

	const rand = seeded(track.def.seed);
	const startPos = track.sampleAt(track.startLineT).pos;
	const nearStart = (x: number, z: number, radius: number) => {
		const dx = x - startPos.x;
		const dz = z - startPos.z;
		return dx * dx + dz * dz < radius * radius;
	};

	group.add(buildHills(track, theme));
	group.add(buildTrees(track, theme, rand, nearStart));
	group.add(buildHouses(track, theme, rand, nearStart));
	group.add(buildLampPosts(track));
	group.add(buildFlags(track, theme));
	group.add(buildRocks(track, theme, rand));
	group.add(buildClouds(track));
	group.add(buildFlowers(track, theme, rand));
	group.add(buildDecorations(track, theme, rand, nearStart));

	switch (theme.accent) {
		case COLORS.teal:
			group.add(buildPond(track, theme));
			group.add(buildBandstand(track, theme));
			break;
		case COLORS.water:
			group.add(buildHarbor(track, theme));
			break;
		case COLORS.orange:
			group.add(buildDinoValley(track, theme));
			break;
		case COLORS.pink:
			group.add(buildCandyGrove(track, theme));
			break;
		default:
			group.add(buildFountain(track.pointAt(0.28, 15)));
			group.add(buildToyShop(track.pointAt(0.08, -22)));
			break;
	}

	if (track.def.id === 'sunny-town' || track.def.id === 'park-loop') {
		group.add(buildBridge(track, 0.54, 0.61));
	}

	return group;
}

function buildHills(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	const geometry = new THREE.SphereGeometry(18, 10, 7);
	const material = new THREE.MeshLambertMaterial({ color: theme.ground2 });
	const positions: [number, number, number][] = [
		[-120, -10, -110],
		[110, -8, -100],
		[-130, -4, 90],
		[125, -6, 80],
		[0, -8, -135]
	];
	for (const [x, y, z] of positions) {
		const hill = new THREE.Mesh(geometry, material);
		hill.position.set(x, y, z);
		hill.scale.set(1.4, 0.55, 1.2);
		group.add(hill);
	}
	return group;
}

function buildTrees(
	track: Track,
	theme: TrackTheme,
	rand: () => number,
	nearStart: (x: number, z: number, r: number) => boolean
): THREE.Group {
	const group = new THREE.Group();
	const positions: { x: number; z: number; s: number }[] = [];
	for (let i = 0; i < 72; i++) {
		for (let attempt = 0; attempt < 20; attempt++) {
			const x = (rand() - 0.5) * 160;
			const z = (rand() - 0.5) * 160;
			if (outsideTrack(track, x, z, 12) && !nearStart(x, z, 20)) {
				positions.push({ x, z, s: 0.8 + rand() * 0.8 });
				break;
			}
		}
	}

	const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.24, 1.5, 6);
	const canopyGeometry = new THREE.ConeGeometry(1.5, 2.6, 7);
	const topGeometry = new THREE.ConeGeometry(1.05, 2.0, 7);
	const trunks = new THREE.InstancedMesh(
		trunkGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.wood }),
		positions.length
	);
	const canopies = new THREE.InstancedMesh(
		canopyGeometry,
		new THREE.MeshLambertMaterial({ color: theme.tree }),
		positions.length
	);
	const tops = new THREE.InstancedMesh(
		topGeometry,
		new THREE.MeshLambertMaterial({ color: theme.tree2 }),
		positions.length
	);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	positions.forEach((tree, i) => {
		const scale = new THREE.Vector3(tree.s, tree.s, tree.s);
		matrix.compose(new THREE.Vector3(tree.x, 0.7 * tree.s, tree.z), quat, scale);
		trunks.setMatrixAt(i, matrix);
		matrix.compose(new THREE.Vector3(tree.x, 2.1 * tree.s, tree.z), quat, scale);
		canopies.setMatrixAt(i, matrix);
		matrix.compose(new THREE.Vector3(tree.x, 3.4 * tree.s, tree.z), quat, scale);
		tops.setMatrixAt(i, matrix);
	});
	for (const mesh of [trunks, canopies, tops]) {
		mesh.instanceMatrix.needsUpdate = true;
		group.add(mesh);
	}
	return group;
}

function buildHouses(
	track: Track,
	theme: TrackTheme,
	rand: () => number,
	nearStart: (x: number, z: number, r: number) => boolean
): THREE.Group {
	const group = new THREE.Group();
	let houses = 0;
	for (let i = 0; i < 60 && houses < 9; i++) {
		const x = (rand() - 0.5) * 140;
		const z = (rand() - 0.5) * 140;
		if (!outsideTrack(track, x, z, 13) || nearStart(x, z, 24)) continue;
		const wall = new THREE.Mesh(
			new THREE.BoxGeometry(4.2, 3.0, 4.2),
			new THREE.MeshLambertMaterial({ color: COLORS.cream })
		);
		wall.position.set(x, 1.5, z);
		group.add(wall);
		const roof = new THREE.Mesh(
			new THREE.ConeGeometry(3.4, 1.9, 4),
			new THREE.MeshLambertMaterial({ color: theme.roofs[houses % theme.roofs.length] })
		);
		roof.position.set(x, 3.85, z);
		roof.rotation.y = Math.PI / 4;
		group.add(roof);
		const door = new THREE.Mesh(
			new THREE.BoxGeometry(1.0, 1.5, 0.12),
			new THREE.MeshLambertMaterial({ color: COLORS.wood })
		);
		door.position.set(x, 0.75, z + 2.12);
		group.add(door);
		for (const side of [-1, 1]) {
			const windowMesh = new THREE.Mesh(
				new THREE.BoxGeometry(0.75, 0.75, 0.12),
				new THREE.MeshLambertMaterial({ color: theme.sky })
			);
			windowMesh.position.set(x + side * 1.2, 1.95, z + 2.12);
			group.add(windowMesh);
		}
		houses++;
	}
	return group;
}

function buildLampPosts(track: Track): THREE.Group {
	const group = new THREE.Group();
	const count = Math.floor(track.length / 42);
	const poleGeometry = new THREE.CylinderGeometry(0.07, 0.1, 2.8, 6);
	const pole = new THREE.InstancedMesh(
		poleGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.inkSoft }),
		count
	);
	const bulb = new THREE.InstancedMesh(
		new THREE.SphereGeometry(0.19, 8, 6),
		new THREE.MeshBasicMaterial({ color: COLORS.gold }),
		count
	);
	const matrix = new THREE.Matrix4();
	for (let i = 0; i < count; i++) {
		const s = track.sampleAtDistance(i * 42 + 16);
		const side = i % 2 === 0 ? 1 : -1;
		const x = s.pos.x + s.normal.x * (track.halfWidth + 2.2) * side;
		const z = s.pos.z + s.normal.z * (track.halfWidth + 2.2) * side;
		matrix.makeTranslation(x, 1.4, z);
		pole.setMatrixAt(i, matrix);
		matrix.makeTranslation(x, 2.9, z);
		bulb.setMatrixAt(i, matrix);
	}
	pole.instanceMatrix.needsUpdate = true;
	bulb.instanceMatrix.needsUpdate = true;
	group.add(pole, bulb);
	return group;
}

function buildFlags(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	const count = Math.floor(track.length / 26);
	const poleGeometry = new THREE.CylinderGeometry(0.035, 0.035, 1.8, 5);
	const flagGeometry = new THREE.BoxGeometry(0.72, 0.42, 0.04);
	const pole = new THREE.InstancedMesh(
		poleGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.cream }),
		count
	);
	const flags = new THREE.InstancedMesh(
		flagGeometry,
		new THREE.MeshLambertMaterial({ color: theme.accent2 }),
		count
	);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	const colors = [theme.accent, theme.accent2, COLORS.yellow, COLORS.cream];
	for (let i = 0; i < count; i++) {
		const s = track.sampleAtDistance(i * 26 + 9);
		const side = i % 2 === 0 ? -1 : 1;
		const x = s.pos.x + s.normal.x * (track.halfWidth + 1.2) * side;
		const z = s.pos.z + s.normal.z * (track.halfWidth + 1.2) * side;
		matrix.makeTranslation(x, 0.9, z);
		pole.setMatrixAt(i, matrix);
		quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(s.tangent.x, s.tangent.z));
		matrix.compose(new THREE.Vector3(x, 1.55, z), quat, new THREE.Vector3(1, 1, 1));
		flags.setMatrixAt(i, matrix);
		flags.setColorAt(i, new THREE.Color(colors[i % colors.length]));
	}
	pole.instanceMatrix.needsUpdate = true;
	flags.instanceMatrix.needsUpdate = true;
	if (flags.instanceColor) flags.instanceColor.needsUpdate = true;
	group.add(pole, flags);
	return group;
}

function buildRocks(
	track: Track,
	theme: TrackTheme,
	rand: () => number
): THREE.Group {
	const group = new THREE.Group();
	const positions: [number, number][] = [];
	for (let i = 0; i < 50 && positions.length < 22; i++) {
		const x = (rand() - 0.5) * 150;
		const z = (rand() - 0.5) * 150;
		if (outsideTrack(track, x, z, 2)) positions.push([x, z]);
	}
	const rocks = new THREE.InstancedMesh(
		new THREE.DodecahedronGeometry(0.6, 0),
		new THREE.MeshLambertMaterial({ color: theme.ground2 }),
		positions.length
	);
	const matrix = new THREE.Matrix4();
	positions.forEach(([x, z], i) => {
		matrix.makeTranslation(x, 0.35, z);
		rocks.setMatrixAt(i, matrix);
	});
	rocks.instanceMatrix.needsUpdate = true;
	group.add(rocks);
	return group;
}

function buildClouds(track: Track): THREE.Group {
	const group = new THREE.Group();
	const material = new THREE.MeshBasicMaterial({ color: COLORS.white });
	const center = track.sampleAt(0).pos;
	for (const [x, y, z, scale] of [
		[-38, 20, -32, 1.3],
		[6, 24, -48, 1.6],
		[40, 19, 14, 1.1],
		[-55, 22, 36, 1.2],
		[58, 18, -8, 1.0]
	]) {
		const cloud = new THREE.Group();
		for (const [dx, dy, dz, s] of [
			[0, 0, 0, 2.2],
			[2.2, 0.3, 0.4, 1.6],
			[-2.1, 0.1, -0.3, 1.5],
			[0.8, 0.9, -0.2, 1.2]
		]) {
			const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), material);
			puff.position.set(dx, dy, dz);
			cloud.add(puff);
		}
		cloud.position.set(center.x + x, y, center.z + z);
		cloud.scale.setScalar(scale);
		group.add(cloud);
	}
	return group;
}

function buildFlowers(track: Track, theme: TrackTheme, rand: () => number): THREE.Group {
	const group = new THREE.Group();
	const geometry = new THREE.SphereGeometry(0.16, 6, 5);
	const colors = [COLORS.yellow, COLORS.pink, theme.accent2, COLORS.cream];
	const positions: { x: number; z: number }[] = [];
	for (let i = 0; i < 140 && positions.length < 90; i++) {
		const x = (rand() - 0.5) * 130;
		const z = (rand() - 0.5) * 130;
		if (outsideTrack(track, x, z, 1.2)) positions.push({ x, z });
	}
	for (let c = 0; c < colors.length; c++) {
		const mesh = new THREE.InstancedMesh(
			geometry,
			new THREE.MeshLambertMaterial({ color: colors[c] }),
			Math.ceil(positions.length / colors.length)
		);
		let n = 0;
		const matrix = new THREE.Matrix4();
		for (let i = c; i < positions.length; i += colors.length) {
			matrix.makeTranslation(positions[i].x, 0.18, positions[i].z);
			mesh.setMatrixAt(n++, matrix);
		}
		mesh.count = n;
		mesh.instanceMatrix.needsUpdate = true;
		group.add(mesh);
	}
	return group;
}

/* ------------------------------------------------------------------ */
/* Landmarks                                                           */
/* ------------------------------------------------------------------ */

function buildFountain(position: THREE.Vector3): THREE.Group {
	const fountain = new THREE.Group();
	fountain.position.copy(position);
	const basin = new THREE.Mesh(
		new THREE.CylinderGeometry(3.4, 3.6, 0.7, 20),
		new THREE.MeshLambertMaterial({ color: COLORS.cream })
	);
	basin.position.y = 0.35;
	fountain.add(basin);
	const water = new THREE.Mesh(
		new THREE.CircleGeometry(3.0, 24),
		new THREE.MeshLambertMaterial({ color: COLORS.water })
	);
	water.rotation.x = -Math.PI / 2;
	water.position.y = 0.72;
	fountain.add(water);
	const column = new THREE.Mesh(
		new THREE.CylinderGeometry(0.42, 0.6, 2.1, 10),
		new THREE.MeshLambertMaterial({ color: COLORS.cream })
	);
	column.position.y = 1.7;
	fountain.add(column);
	const top = new THREE.Mesh(
		new THREE.CylinderGeometry(1.2, 0.9, 0.4, 14),
		new THREE.MeshLambertMaterial({ color: COLORS.cream })
	);
	top.position.y = 2.8;
	fountain.add(top);
	const duck = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.SphereGeometry(0.5, 12, 10),
		new THREE.MeshLambertMaterial({ color: COLORS.yellow })
	);
	body.scale.set(1.2, 0.9, 1);
	duck.add(body);
	const head = new THREE.Mesh(
		new THREE.SphereGeometry(0.28, 12, 10),
		new THREE.MeshLambertMaterial({ color: COLORS.yellow })
	);
	head.position.set(0.35, 0.45, 0);
	duck.add(head);
	const beak = new THREE.Mesh(
		new THREE.ConeGeometry(0.12, 0.3, 8),
		new THREE.MeshLambertMaterial({ color: COLORS.orange })
	);
	beak.rotation.z = -Math.PI / 2;
	beak.position.set(0.65, 0.42, 0);
	duck.add(beak);
	duck.position.y = 3.2;
	fountain.add(duck);
	return fountain;
}

function buildToyShop(position: THREE.Vector3): THREE.Group {
	const shop = new THREE.Group();
	shop.position.copy(position);
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(7, 4.2, 5),
		new THREE.MeshLambertMaterial({ color: COLORS.cream })
	);
	body.position.y = 2.1;
	shop.add(body);
	const roof = new THREE.Mesh(
		new THREE.ConeGeometry(5.4, 2.2, 4),
		new THREE.MeshLambertMaterial({ color: COLORS.red })
	);
	roof.position.y = 5.3;
	roof.rotation.y = Math.PI / 4;
	shop.add(roof);
	for (let i = 0; i < 6; i++) {
		const stripe = new THREE.Mesh(
			new THREE.BoxGeometry(1.15, 0.12, 1.4),
			new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? COLORS.red : COLORS.cream })
		);
		stripe.position.set(-2.9 + i * 1.16, 3.0, 2.9);
		stripe.rotation.x = 0.28;
		shop.add(stripe);
	}
	const pencil = new THREE.Group();
	const shaft = new THREE.Mesh(
		new THREE.CylinderGeometry(0.18, 0.18, 3.2, 8),
		new THREE.MeshLambertMaterial({ color: COLORS.yellow })
	);
	shaft.position.y = 1.6;
	pencil.add(shaft);
	const tip = new THREE.Mesh(
		new THREE.ConeGeometry(0.18, 0.55, 8),
		new THREE.MeshLambertMaterial({ color: COLORS.ink })
	);
	tip.position.y = 3.47;
	pencil.add(tip);
	pencil.position.set(3.3, 3.9, 2.7);
	pencil.rotation.z = 0.25;
	shop.add(pencil);
	return shop;
}

function buildPond(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	const p = track.pointAt(0.3, 18);
	const benchSpot = track.pointAt(0.035, 12);
	const bench = new THREE.Group();
	const seat = new THREE.Mesh(
		new THREE.BoxGeometry(3.2, 0.24, 0.8),
		new THREE.MeshLambertMaterial({ color: theme.accent })
	);
	seat.position.y = 0.55;
	bench.add(seat);
	const back = new THREE.Mesh(
		new THREE.BoxGeometry(3.2, 1.0, 0.18),
		new THREE.MeshLambertMaterial({ color: COLORS.cream })
	);
	back.position.set(0, 1.05, -0.36);
	bench.add(back);
	bench.position.copy(benchSpot);
	group.add(bench);
	const water = new THREE.Mesh(
		new THREE.CircleGeometry(8, 28),
		new THREE.MeshLambertMaterial({ color: theme.water })
	);
	water.rotation.x = -Math.PI / 2;
	water.position.set(p.x, 0.02, p.z);
	group.add(water);
	for (const [dx, dz, s] of [
		[2, 1, 1],
		[-3, -2, 0.8],
		[4, -3, 0.65]
	]) {
		const duck = new THREE.Group();
		const body = new THREE.Mesh(
			new THREE.SphereGeometry(0.45, 10, 8),
			new THREE.MeshLambertMaterial({ color: COLORS.yellow })
		);
		body.scale.set(1.2, 0.8, 1);
		duck.add(body);
		const head = new THREE.Mesh(
			new THREE.SphereGeometry(0.24, 10, 8),
			new THREE.MeshLambertMaterial({ color: COLORS.yellow })
		);
		head.position.set(0.32, 0.35, 0);
		duck.add(head);
		const beak = new THREE.Mesh(
			new THREE.ConeGeometry(0.1, 0.25, 6),
			new THREE.MeshLambertMaterial({ color: COLORS.orange })
		);
		beak.rotation.z = -Math.PI / 2;
		beak.position.set(0.55, 0.32, 0);
		duck.add(beak);
		duck.position.set(p.x + dx, 0.35, p.z + dz);
		duck.scale.setScalar(s);
		group.add(duck);
	}
	return group;
}

function buildBandstand(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	const p = track.pointAt(0.62, -16);
	const base = new THREE.Mesh(
		new THREE.CylinderGeometry(4.2, 4.4, 0.5, 12),
		new THREE.MeshLambertMaterial({ color: theme.accent })
	);
	base.position.set(p.x, 0.25, p.z);
	group.add(base);
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const post = new THREE.Mesh(
			new THREE.CylinderGeometry(0.09, 0.09, 2.8, 5),
			new THREE.MeshLambertMaterial({ color: COLORS.cream })
		);
		post.position.set(p.x + Math.cos(angle) * 3.7, 1.8, p.z + Math.sin(angle) * 3.7);
		group.add(post);
	}
	const roof = new THREE.Mesh(
		new THREE.ConeGeometry(4.8, 2.2, 8),
		new THREE.MeshLambertMaterial({ color: theme.roofs[0] })
	);
	roof.position.set(p.x, 4.0, p.z);
	group.add(roof);
	return group;
}

function buildHarbor(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	const p = track.pointAt(0.42, 28);
	const water = new THREE.Mesh(
		new THREE.CircleGeometry(28, 32),
		new THREE.MeshLambertMaterial({ color: theme.water })
	);
	water.rotation.x = -Math.PI / 2;
	water.position.set(p.x, -0.04, p.z);
	group.add(water);

	const tower = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.CylinderGeometry(1.5, 2.2, 10, 12),
		new THREE.MeshLambertMaterial({ color: COLORS.cream })
	);
	body.position.y = 5;
	tower.add(body);
	const stripe = new THREE.Mesh(
		new THREE.CylinderGeometry(1.55, 1.85, 2.2, 12),
		new THREE.MeshLambertMaterial({ color: COLORS.red })
	);
	stripe.position.y = 5.5;
	tower.add(stripe);
	const light = new THREE.Mesh(
		new THREE.SphereGeometry(0.75, 10, 8),
		new THREE.MeshBasicMaterial({ color: COLORS.gold })
	);
	light.position.y = 11;
	tower.add(light);
	const cap = new THREE.Mesh(
		new THREE.ConeGeometry(1.8, 1.4, 8),
		new THREE.MeshLambertMaterial({ color: COLORS.red })
	);
	cap.position.y = 12;
	tower.add(cap);
	tower.position.set(p.x, 0, p.z);
	group.add(tower);

	const dockSpot = track.pointAt(0.035, 14);
	const dock = new THREE.Mesh(
		new THREE.BoxGeometry(5.5, 0.18, 2.2),
		new THREE.MeshLambertMaterial({ color: COLORS.wood })
	);
	dock.position.set(dockSpot.x, 0.12, dockSpot.z);
	group.add(dock);
	for (const side of [-1, 1]) {
		const post = new THREE.Mesh(
			new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6),
			new THREE.MeshLambertMaterial({ color: COLORS.wood })
		);
		post.position.set(dockSpot.x + side * 2.4, 0.6, dockSpot.z);
		group.add(post);
	}

	for (const [dx, dz, rot] of [
		[8, 6, 0.4],
		[-9, 4, -0.5],
		[2, -10, 0.2]
	]) {
		const boat = new THREE.Group();
		const hull = new THREE.Mesh(
			new THREE.BoxGeometry(2.6, 0.6, 1.2),
			new THREE.MeshLambertMaterial({ color: COLORS.red })
		);
		hull.position.y = 0.3;
		boat.add(hull);
		const sail = new THREE.Mesh(
			new THREE.ConeGeometry(1.0, 2.2, 3),
			new THREE.MeshLambertMaterial({ color: COLORS.cream })
		);
		sail.position.y = 1.7;
		boat.add(sail);
		boat.position.set(p.x + dx, 0.05, p.z + dz);
		boat.rotation.y = rot;
		group.add(boat);
	}
	return group;
}

function buildDinoValley(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	const p = track.pointAt(0.24, 30);
	const volcano = new THREE.Group();
	const cone = new THREE.Mesh(
		new THREE.ConeGeometry(13, 18, 8),
		new THREE.MeshLambertMaterial({ color: theme.ground2 })
	);
	cone.position.y = 9;
	volcano.add(cone);
	const crater = new THREE.Mesh(
		new THREE.CylinderGeometry(3.2, 4.2, 1.2, 8),
		new THREE.MeshLambertMaterial({ color: COLORS.red })
	);
	crater.position.y = 18.2;
	volcano.add(crater);
	const smoke = new THREE.Mesh(
		new THREE.SphereGeometry(3.4, 10, 8),
		new THREE.MeshBasicMaterial({ color: COLORS.cream, transparent: true, opacity: 0.55 })
	);
	smoke.position.y = 22;
	smoke.scale.set(1.4, 0.7, 1.4);
	volcano.add(smoke);
	volcano.position.set(p.x, 0, p.z);
	group.add(volcano);

	const boneSpot = track.pointAt(0.035, -14);
	const boneMaterial = new THREE.MeshLambertMaterial({ color: COLORS.cream });
	for (const side of [-1, 1]) {
		const bone = new THREE.Mesh(
			new THREE.CylinderGeometry(0.22, 0.22, 4.2, 6),
			boneMaterial
		);
		bone.position.set(boneSpot.x + side * 1.8, 2.1, boneSpot.z);
		group.add(bone);
		for (const end of [-1, 1]) {
			const knob = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), boneMaterial);
			knob.position.set(boneSpot.x + side * 1.8, 2.1 + end * 2.1, boneSpot.z);
			group.add(knob);
		}
	}
	const boneTop = new THREE.Mesh(
		new THREE.CylinderGeometry(0.2, 0.2, 4.2, 6),
		boneMaterial
	);
	boneTop.rotation.z = Math.PI / 2;
	boneTop.position.set(boneSpot.x, 4.1, boneSpot.z);
	group.add(boneTop);

	for (let i = 0; i < 6; i++) {
		const fern = new THREE.Group();
		for (let j = 0; j < 5; j++) {
			const leaf = new THREE.Mesh(
				new THREE.ConeGeometry(0.35, 3.2, 4),
				new THREE.MeshLambertMaterial({ color: theme.tree })
			);
			leaf.rotation.z = (j / 5) * Math.PI * 2;
			leaf.position.y = 1.6;
			fern.add(leaf);
		}
		const fp = track.pointAt(0.1 + i * 0.13, i % 2 === 0 ? 16 : -18);
		fern.position.set(fp.x, 0, fp.z);
		group.add(fern);
	}
	return group;
}

function buildCandyGrove(track: Track, theme: TrackTheme): THREE.Group {
	const group = new THREE.Group();
	for (let i = 0; i < 7; i++) {
		const p = track.pointAt(0.02 + i * 0.13, i % 2 === 0 ? 12 : -13);
		const stick = new THREE.Mesh(
			new THREE.CylinderGeometry(0.12, 0.12, 5.5, 6),
			new THREE.MeshLambertMaterial({ color: COLORS.cream })
		);
		stick.position.set(p.x, 2.75, p.z);
		group.add(stick);
		const candy = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 1.5, 0.55, 16),
			new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? theme.accent : theme.accent2 })
		);
		candy.rotation.x = Math.PI / 2;
		candy.position.set(p.x, 6.3, p.z);
		group.add(candy);
		const swirl = new THREE.Mesh(
			new THREE.TorusGeometry(0.85, 0.16, 6, 18),
			new THREE.MeshLambertMaterial({ color: COLORS.cream })
		);
		swirl.rotation.x = Math.PI / 2;
		swirl.position.set(p.x, 6.3, p.z + 0.32);
		group.add(swirl);
	}
	const p = track.pointAt(0.55, 20);
	const gumdrop = new THREE.Mesh(
		new THREE.SphereGeometry(5, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
		new THREE.MeshLambertMaterial({ color: theme.accent2 })
	);
	gumdrop.scale.set(1.2, 0.8, 1.2);
	gumdrop.position.set(p.x, 0, p.z);
	group.add(gumdrop);
	return group;
}

function buildBridge(track: Track, startT: number, endT: number): THREE.Group {
	const bridge = new THREE.Group();
	const count = 22;
	const woodMaterial = new THREE.MeshLambertMaterial({ color: COLORS.wood });
	for (let i = 0; i <= count; i++) {
		const t = startT + ((endT - startT) * i) / count;
		const s = track.sampleAt(t);
		for (const side of [-1, 1]) {
			const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodMaterial);
			post.position.set(
				s.pos.x + s.normal.x * (track.halfWidth - 0.15) * side,
				0.55,
				s.pos.z + s.normal.z * (track.halfWidth - 0.15) * side
			);
			bridge.add(post);
		}
		if (i % 2 === 0) {
			for (const side of [-1, 1]) {
				const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), woodMaterial);
				rail.position.set(
					s.pos.x + s.normal.x * (track.halfWidth - 0.15) * side,
					1.0,
					s.pos.z + s.normal.z * (track.halfWidth - 0.15) * side
				);
				rail.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
				bridge.add(rail);
			}
		}
	}
	const stream = new THREE.Mesh(
		new THREE.PlaneGeometry(30, 18),
		new THREE.MeshLambertMaterial({ color: COLORS.water })
	);
	stream.rotation.x = -Math.PI / 2;
	const mid = track.sampleAt((startT + endT) / 2);
	stream.position.set(mid.pos.x + mid.normal.x * 4, -0.02, mid.pos.z + mid.normal.z * 4);
	bridge.add(stream);
	return bridge;
}
