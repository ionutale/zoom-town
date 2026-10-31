import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Groups of small, never-animated meshes (car bodies, balloon trims, track
 * furniture) are the biggest source of draw calls in the game. Baking them into
 * one mesh per material keeps the exact same pixels while cutting the calls.
 */

function materialKey(material: THREE.Material): string {
	const lit = material as THREE.MeshLambertMaterial;
	return [
		material.type,
		lit.color ? lit.color.getHexString() : '',
		lit.emissive ? lit.emissive.getHexString() : '',
		lit.emissiveIntensity ?? '',
		lit.flatShading ? 'flat' : 'smooth',
		lit.vertexColors ? 'vc' : '',
		material.transparent ? `t${material.opacity}` : '',
		material.side,
		material.depthWrite ? 'dw' : '',
		material.depthTest ? 'dt' : ''
	].join('|');
}

interface Bucket {
	material: THREE.Material;
	geometries: THREE.BufferGeometry[];
	castShadow: boolean;
	receiveShadow: boolean;
}

/**
 * Merges meshes whose transforms are relative to the same parent into one mesh
 * per material. Returns the new meshes; the inputs are left untouched so they
 * can be dropped by the caller.
 */
export function mergeMeshesByMaterial(meshes: THREE.Mesh[]): THREE.Mesh[] {
	const buckets = new Map<string, Bucket>();
	for (const mesh of meshes) {
		mesh.updateMatrix();
		const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix);
		const key = materialKey(mesh.material as THREE.Material);
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = {
				material: mesh.material as THREE.Material,
				geometries: [],
				castShadow: false,
				receiveShadow: false
			};
			buckets.set(key, bucket);
		}
		bucket.geometries.push(geometry);
		bucket.castShadow = bucket.castShadow || mesh.castShadow;
		bucket.receiveShadow = bucket.receiveShadow || mesh.receiveShadow;
	}

	const merged: THREE.Mesh[] = [];
	for (const bucket of buckets.values()) {
		const geometry =
			bucket.geometries.length === 1
				? bucket.geometries[0]
				: mergeGeometries(bucket.geometries, false);
		for (const piece of geometry ? [geometry] : bucket.geometries) {
			const mesh = new THREE.Mesh(piece, bucket.material);
			mesh.castShadow = bucket.castShadow;
			mesh.receiveShadow = bucket.receiveShadow;
			merged.push(mesh);
		}
	}
	return merged;
}
