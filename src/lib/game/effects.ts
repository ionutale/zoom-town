import * as THREE from 'three';
import { COLORS } from './palette';

interface Particle {
	mesh: THREE.Mesh;
	velocity: THREE.Vector3;
	life: number;
	maxLife: number;
	spin: number;
}

export class Effects {
	readonly root = new THREE.Group();
	private particles: Particle[] = [];
	private rings: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];
	private ringGeometry = new THREE.RingGeometry(0.28, 0.38, 20);
	private sparkGeometry = new THREE.SphereGeometry(0.07, 6, 5);

	pop(position: THREE.Vector3, color: number): void {
		const ring = new THREE.Mesh(
			this.ringGeometry,
			new THREE.MeshBasicMaterial({
				color: COLORS.white,
				transparent: true,
				opacity: 0.9,
				side: THREE.DoubleSide
			})
		);
		ring.position.copy(position);
		ring.rotation.x = -Math.PI / 2;
		this.root.add(ring);
		this.rings.push({ mesh: ring, life: 0, maxLife: 0.38 });

		for (let i = 0; i < 7; i++) {
			const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
			const spark = new THREE.Mesh(
				this.sparkGeometry,
				new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? color : COLORS.gold })
			);
			spark.position.copy(position);
			this.root.add(spark);
			this.particles.push({
				mesh: spark,
				velocity: new THREE.Vector3(
					Math.cos(angle) * 1.7,
					1.2 + Math.random(),
					Math.sin(angle) * 1.7
				),
				life: 0,
				maxLife: 0.55 + Math.random() * 0.2,
				spin: (Math.random() - 0.5) * 9
			});
		}
	}

	confettiBurst(position: THREE.Vector3): void {
		for (let i = 0; i < 18; i++) {
			const angle = (i / 18) * Math.PI * 2;
			const spark = new THREE.Mesh(
				this.sparkGeometry,
				new THREE.MeshBasicMaterial({
					color: [COLORS.gold, COLORS.pink, COLORS.teal, COLORS.cream][i % 4]
				})
			);
			spark.position.copy(position);
			spark.position.y += 1;
			this.root.add(spark);
			this.particles.push({
				mesh: spark,
				velocity: new THREE.Vector3(
					Math.cos(angle) * 3,
					3 + Math.random() * 2.5,
					Math.sin(angle) * 3
				),
				life: 0,
				maxLife: 0.9 + Math.random() * 0.4,
				spin: (Math.random() - 0.5) * 12
			});
		}
	}

	update(dt: number): void {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life += dt;
			p.velocity.y -= 5.5 * dt;
			p.mesh.position.addScaledVector(p.velocity, dt);
			p.mesh.rotation.x += p.spin * dt;
			p.mesh.rotation.z += p.spin * dt * 0.7;
			const t = p.life / p.maxLife;
			p.mesh.scale.setScalar(Math.max(0.01, 1 - t));
			(p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t);
			if (p.life >= p.maxLife) {
				p.mesh.removeFromParent();
				// Geometry is shared by every spark; only the material is per
				// particle, so disposing the geometry here would yank the buffer
				// out from under the sparks still in flight.
				(p.mesh.material as THREE.MeshBasicMaterial).dispose();
				this.particles.splice(i, 1);
			}
		}

		for (let i = this.rings.length - 1; i >= 0; i--) {
			const r = this.rings[i];
			r.life += dt;
			const t = r.life / r.maxLife;
			r.mesh.scale.setScalar(1 + t * 3.2);
			(r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - t);
			if (r.life >= r.maxLife) {
				r.mesh.removeFromParent();
				(r.mesh.material as THREE.MeshBasicMaterial).dispose();
				this.rings.splice(i, 1);
			}
		}
	}

	clear(): void {
		for (const p of this.particles) {
			p.mesh.removeFromParent();
			(p.mesh.material as THREE.MeshBasicMaterial).dispose();
		}
		this.particles = [];
		for (const r of this.rings) {
			r.mesh.removeFromParent();
			(r.mesh.material as THREE.MeshBasicMaterial).dispose();
		}
		this.rings = [];
	}

	/** Releases the two shared geometries; call once when the game tears down. */
	dispose(): void {
		this.clear();
		this.ringGeometry.dispose();
		this.sparkGeometry.dispose();
		this.root.removeFromParent();
	}
}
