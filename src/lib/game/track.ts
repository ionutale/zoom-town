import * as THREE from 'three';
import { COLORS } from './palette';

export const TRACK_WIDTH = 8;
export const HALF_WIDTH = TRACK_WIDTH / 2;
export const MAX_LATERAL = HALF_WIDTH - 0.9;
export const START_T = 0;
export const START_LINE_T = 0.04;

const CONTROL_POINTS: [number, number][] = [
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
];

export const trackCurve = new THREE.CatmullRomCurve3(
	CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
	true,
	'catmullrom',
	0.5
);
trackCurve.arcLengthDivisions = 2400;

export const TRACK_LENGTH = trackCurve.getLength();
export const SAMPLE_COUNT = 720;

export interface TrackSample {
	pos: THREE.Vector3;
	tangent: THREE.Vector3;
	normal: THREE.Vector3;
	t: number;
	distance: number;
	index: number;
}

function makeSample(t: number, index: number): TrackSample {
	const pos = trackCurve.getPointAt(t);
	const tangent = trackCurve.getTangentAt(t).normalize();
	const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
	return { pos, tangent, normal, t, distance: t * TRACK_LENGTH, index };
}

export const samples: TrackSample[] = Array.from({ length: SAMPLE_COUNT }, (_, i) =>
	makeSample(i / SAMPLE_COUNT, i)
);

export function sampleAt(t: number): TrackSample {
	const u = ((t % 1) + 1) % 1;
	return samples[Math.floor(u * SAMPLE_COUNT) % SAMPLE_COUNT];
}

export function sampleAtDistance(distance: number): TrackSample {
	const u = (((distance / TRACK_LENGTH) % 1) + 1) % 1;
	return samples[Math.floor(u * SAMPLE_COUNT) % SAMPLE_COUNT];
}

export interface NearestResult {
	index: number;
	sample: TrackSample;
	lateral: number;
	centerDistance: number;
}

export function nearestSample(point: THREE.Vector3, hintIndex?: number): NearestResult {
	const window = hintIndex === undefined ? SAMPLE_COUNT : 48;
	const start = hintIndex === undefined ? 0 : hintIndex - window / 2;
	let best = -1;
	let bestDist = Infinity;
	for (let k = 0; k < window; k++) {
		const i = (((start + k) % SAMPLE_COUNT) + SAMPLE_COUNT) % SAMPLE_COUNT;
		const s = samples[i];
		const dx = point.x - s.pos.x;
		const dz = point.z - s.pos.z;
		const d = dx * dx + dz * dz;
		if (d < bestDist) {
			bestDist = d;
			best = i;
		}
	}
	const sample = samples[best];
	const lateral =
		(point.x - sample.pos.x) * sample.normal.x + (point.z - sample.pos.z) * sample.normal.z;
	return { index: best, sample, lateral, centerDistance: Math.sqrt(bestDist) };
}

export function distanceFromTrack(point: THREE.Vector3): number {
	return nearestSample(point).centerDistance;
}

function ribbon(
	samplesToUse: TrackSample[],
	offset: number,
	width: number,
	color: number,
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
	geometry.userData.color = color;
	return geometry;
}

function meshFromRibbon(
	samplesToUse: TrackSample[],
	offset: number,
	width: number,
	color: number,
	y: number,
	lit = true
): THREE.Mesh {
	const geometry = ribbon(samplesToUse, offset, width, color, y);
	const material = lit
		? new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
		: new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
	const mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = false;
	return mesh;
}

export function buildTrackGroup(): THREE.Group {
	const group = new THREE.Group();
	group.name = 'track';

	const road = meshFromRibbon(samples, 0, TRACK_WIDTH, COLORS.road, 0);
	group.add(road);

	group.add(meshFromRibbon(samples, HALF_WIDTH - 0.28, 0.18, COLORS.cream, 0.025, false));
	group.add(meshFromRibbon(samples, -HALF_WIDTH + 0.28, 0.18, COLORS.cream, 0.025, false));

	const dashGeometry = new THREE.BoxGeometry(0.12, 0.02, 1.15);
	const dashMaterial = new THREE.MeshBasicMaterial({ color: COLORS.cream });
	const dashCount = Math.floor(TRACK_LENGTH / 6);
	const dashes = new THREE.InstancedMesh(dashGeometry, dashMaterial, dashCount);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	const up = new THREE.Vector3(0, 1, 0);
	for (let i = 0; i < dashCount; i++) {
		const s = sampleAtDistance(i * 6 + 2);
		quat.setFromAxisAngle(up, Math.atan2(s.tangent.x, s.tangent.z));
		matrix.compose(new THREE.Vector3(s.pos.x, 0.03, s.pos.z), quat, new THREE.Vector3(1, 1, 1));
		dashes.setMatrixAt(i, matrix);
	}
	dashes.instanceMatrix.needsUpdate = true;
	group.add(dashes);

	const curbGeometry = new THREE.BoxGeometry(0.5, 0.18, 1.7);
	const redCurbs = new THREE.InstancedMesh(
		curbGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.red }),
		Math.ceil(TRACK_LENGTH / 3.4)
	);
	const creamCurbs = new THREE.InstancedMesh(
		curbGeometry,
		new THREE.MeshLambertMaterial({ color: COLORS.cream }),
		Math.ceil(TRACK_LENGTH / 3.4)
	);
	let redIndex = 0;
	let creamIndex = 0;
	for (let i = 0; i < Math.ceil(TRACK_LENGTH / 3.4); i++) {
		const s = sampleAtDistance(i * 3.4);
		quat.setFromAxisAngle(up, Math.atan2(s.tangent.x, s.tangent.z));
		for (const side of [-1, 1]) {
			const p = new THREE.Vector3(
				s.pos.x + s.normal.x * (HALF_WIDTH - 0.22) * side,
				0.09,
				s.pos.z + s.normal.z * (HALF_WIDTH - 0.22) * side
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

	const start = sampleAt(START_LINE_T);
	const checker = new THREE.Group();
	for (let i = 0; i < 8; i++) {
		const across = -HALF_WIDTH + 0.5 + i;
		const tile = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 0.025, 1.4),
			new THREE.MeshBasicMaterial({
				color: i % 2 === 0 ? COLORS.ink : COLORS.cream
			})
		);
		tile.position.set(
			start.pos.x + start.normal.x * across,
			0.04,
			start.pos.z + start.normal.z * across
		);
		tile.rotation.y = Math.atan2(start.tangent.x, start.tangent.z);
		checker.add(tile);
	}
	group.add(checker);

	group.add(buildGantry());
	return group;
}

function buildGantry(): THREE.Group {
	const gantry = new THREE.Group();
	const s = sampleAt(START_LINE_T);
	const angle = Math.atan2(s.tangent.x, s.tangent.z);
	gantry.position.copy(s.pos);
	gantry.rotation.y = angle;

	const postMaterial = new THREE.MeshLambertMaterial({ color: COLORS.cream });
	const stripeMaterial = new THREE.MeshLambertMaterial({ color: COLORS.red });
	for (const side of [-1, 1]) {
		const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 5.8, 0.38), postMaterial);
		post.position.set(side * (HALF_WIDTH + 0.6), 2.9, 0);
		gantry.add(post);
		const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), stripeMaterial);
		stripe.position.set(side * (HALF_WIDTH + 0.6), 3.5, 0);
		gantry.add(stripe);
	}
	const beam = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH + 2.6, 0.72, 0.7), postMaterial);
	beam.position.y = 5.55;
	gantry.add(beam);
	const stripe = new THREE.Mesh(
		new THREE.BoxGeometry(TRACK_WIDTH + 2.6, 0.22, 0.74),
		stripeMaterial
	);
	stripe.position.y = 5.55;
	gantry.add(stripe);
	for (const x of [-3, 0, 3]) {
		const lamp = new THREE.Mesh(
			new THREE.SphereGeometry(0.34, 12, 10),
			new THREE.MeshBasicMaterial({ color: COLORS.gold })
		);
		lamp.position.set(x, 5.9, 0.1);
		gantry.add(lamp);
	}
	return gantry;
}

function seeded(seed: number): () => number {
	let value = seed;
	return () => {
		value = (value * 1664525 + 1013904223) % 4294967296;
		return value / 4294967296;
	};
}

function outsideTrack(x: number, z: number, clearance = 5): boolean {
	return distanceFromTrack(new THREE.Vector3(x, 0, z)) > HALF_WIDTH + clearance;
}

export function buildSceneryGroup(): THREE.Group {
	const group = new THREE.Group();
	group.name = 'scenery';

	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry(260, 260, 1, 1),
		new THREE.MeshLambertMaterial({ color: COLORS.grass })
	);
	ground.rotation.x = -Math.PI / 2;
	ground.position.y = -0.06;
	group.add(ground);

	const rand = seeded(20261031);
	const startPos = sampleAt(START_LINE_T).pos;
	const nearStart = (x: number, z: number, radius: number) => {
		const dx = x - startPos.x;
		const dz = z - startPos.z;
		return dx * dx + dz * dz < radius * radius;
	};

	const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.24, 1.5, 6);
	const trunkMaterial = new THREE.MeshLambertMaterial({ color: COLORS.wood });
	const canopyGeometry = new THREE.ConeGeometry(1.5, 2.6, 7);
	const canopyMaterial = new THREE.MeshLambertMaterial({ color: COLORS.grass2 });
	const canopyTopGeometry = new THREE.ConeGeometry(1.05, 2.0, 7);
	const canopyTopMaterial = new THREE.MeshLambertMaterial({ color: COLORS.grass });

	const treePositions: { x: number; z: number; s: number }[] = [];
	for (let i = 0; i < 58; i++) {
		for (let attempt = 0; attempt < 20; attempt++) {
			const x = (rand() - 0.5) * 150;
			const z = (rand() - 0.5) * 150;
			if (outsideTrack(x, z, 13) && !nearStart(x, z, 22)) {
				treePositions.push({ x, z, s: 0.8 + rand() * 0.7 });
				break;
			}
		}
	}

	const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treePositions.length);
	const canopies = new THREE.InstancedMesh(canopyGeometry, canopyMaterial, treePositions.length);
	const tops = new THREE.InstancedMesh(canopyTopGeometry, canopyTopMaterial, treePositions.length);
	const matrix = new THREE.Matrix4();
	const quat = new THREE.Quaternion();
	treePositions.forEach((tree, i) => {
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

	const houseColors = [COLORS.red, COLORS.blue, COLORS.teal, COLORS.orange];
	let houses = 0;
	for (let i = 0; i < 55 && houses < 11; i++) {
		const x = (rand() - 0.5) * 130;
		const z = (rand() - 0.5) * 130;
		if (!outsideTrack(x, z, 13) || nearStart(x, z, 24)) continue;
		const wall = new THREE.Mesh(
			new THREE.BoxGeometry(4.2, 3.0, 4.2),
			new THREE.MeshLambertMaterial({ color: COLORS.cream })
		);
		wall.position.set(x, 1.5, z);
		group.add(wall);
		const roof = new THREE.Mesh(
			new THREE.ConeGeometry(3.4, 1.9, 4),
			new THREE.MeshLambertMaterial({ color: houseColors[houses % houseColors.length] })
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
				new THREE.MeshLambertMaterial({ color: COLORS.sky })
			);
			windowMesh.position.set(x + side * 1.2, 1.95, z + 2.12);
			group.add(windowMesh);
		}
		houses++;
	}

	group.add(buildFountain());
	group.add(buildToyShop());
	group.add(buildBridge());
	group.add(buildClouds());
	group.add(buildFlowers(rand));

	return group;
}

function buildFountain(): THREE.Group {
	const fountain = new THREE.Group();
	fountain.position.set(20, 0, 0);
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

function buildToyShop(): THREE.Group {
	const shop = new THREE.Group();
	shop.position.set(0, 0, 82);
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

function buildBridge(): THREE.Group {
	const bridge = new THREE.Group();
	const startT = 0.54;
	const endT = 0.61;
	const count = 22;
	const woodMaterial = new THREE.MeshLambertMaterial({ color: COLORS.wood });
	for (let i = 0; i <= count; i++) {
		const t = startT + ((endT - startT) * i) / count;
		const s = sampleAt(t);
		for (const side of [-1, 1]) {
			const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodMaterial);
			post.position.set(
				s.pos.x + s.normal.x * (HALF_WIDTH - 0.15) * side,
				0.55,
				s.pos.z + s.normal.z * (HALF_WIDTH - 0.15) * side
			);
			bridge.add(post);
		}
		if (i % 2 === 0) {
			for (const side of [-1, 1]) {
				const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), woodMaterial);
				rail.position.set(
					s.pos.x + s.normal.x * (HALF_WIDTH - 0.15) * side,
					1.0,
					s.pos.z + s.normal.z * (HALF_WIDTH - 0.15) * side
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
	stream.position.set(24, -0.02, -62);
	bridge.add(stream);
	return bridge;
}

function buildClouds(): THREE.Group {
	const clouds = new THREE.Group();
	const material = new THREE.MeshBasicMaterial({ color: COLORS.white });
	for (const [x, y, z, scale] of [
		[-38, 20, -32, 1.3],
		[6, 24, -48, 1.6],
		[40, 19, 14, 1.1]
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
		cloud.position.set(x, y, z);
		cloud.scale.setScalar(scale);
		clouds.add(cloud);
	}
	return clouds;
}

function buildFlowers(rand: () => number): THREE.Group {
	const group = new THREE.Group();
	const geometry = new THREE.SphereGeometry(0.16, 6, 5);
	const colors = [COLORS.yellow, COLORS.pink, COLORS.red, COLORS.cream];
	const positions: { x: number; z: number }[] = [];
	for (let i = 0; i < 120 && positions.length < 80; i++) {
		const x = (rand() - 0.5) * 110;
		const z = (rand() - 0.5) * 110;
		if (outsideTrack(x, z, 1.2)) positions.push({ x, z });
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
