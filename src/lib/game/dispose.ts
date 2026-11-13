import * as THREE from 'three';

/**
 * Ownership helper for GPU resources.
 *
 * Three.js keeps geometries and materials on the GPU until they are explicitly
 * disposed. The game rebuilds cars, rivals and whole tracks as the child plays,
 * so anything dropped from the scene must be released here or the WebGL context
 * slowly fills up until iOS drops it.
 *
 * A handful of resources are deliberately shared across instances (the wheel
 * geometry, the balloon trim bases). Those are marked once at module load and
 * skipped, so disposing one car can never pull the buffers out from under the
 * next one.
 */
const shared = new WeakSet<object>();

/** Marks geometries/materials that outlive the object referencing them. */
export function markSharedResource(...resources: object[]): void {
	for (const resource of resources) shared.add(resource);
}

function disposeMaterial(material: THREE.Material): void {
	if (shared.has(material)) return;
	material.dispose();
}

/**
 * Releases every geometry and material under `root`.
 * Callers still remove the object from its parent; this only frees GPU memory.
 */
export function disposeObject3D(root: THREE.Object3D): void {
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		if (!shared.has(object.geometry)) object.geometry.dispose();
		if (Array.isArray(object.material)) {
			for (const material of object.material) disposeMaterial(material);
		} else {
			disposeMaterial(object.material);
		}
	});
}
