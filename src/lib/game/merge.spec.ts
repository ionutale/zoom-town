import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { mergeMeshesByMaterial } from './merge';

function box(color: number, x = 0): THREE.Mesh {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshLambertMaterial({ color })
	);
	mesh.position.x = x;
	return mesh;
}

describe('mesh merging', () => {
	it('bakes every mesh with the same material into one', () => {
		const merged = mergeMeshesByMaterial([box(0xff0000), box(0xff0000, 4), box(0xff0000, 8)]);
		expect(merged).toHaveLength(1);
		expect(merged[0].geometry.getAttribute('position').count).toBe(72);
	});

	it('keeps different colours apart', () => {
		const merged = mergeMeshesByMaterial([box(0xff0000), box(0x00ff00), box(0x00ff00)]);
		expect(merged).toHaveLength(2);
	});

	it('keeps transparency and shading in the key', () => {
		const opaque = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const faded = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
		const flat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
		const smooth = new THREE.MeshLambertMaterial({ color: 0xffffff });
		const geometries = () => new THREE.BoxGeometry(1, 1, 1);

		const merged = mergeMeshesByMaterial([
			new THREE.Mesh(geometries(), opaque),
			new THREE.Mesh(geometries(), faded),
			new THREE.Mesh(geometries(), flat),
			new THREE.Mesh(geometries(), smooth),
			new THREE.Mesh(geometries(), smooth)
		]);
		expect(merged).toHaveLength(4);
	});

	it('applies each mesh offset to the baked geometry', () => {
		const merged = mergeMeshesByMaterial([box(0xff0000, 10), box(0xff0000, -10)]);
		merged[0].geometry.computeBoundingBox();
		const bounds = merged[0].geometry.boundingBox;
		expect(bounds?.min.x).toBeCloseTo(-10.5, 5);
		expect(bounds?.max.x).toBeCloseTo(10.5, 5);
	});
});
