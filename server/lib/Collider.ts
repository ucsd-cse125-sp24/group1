import * as phys from "cannon-es";

export type Collider = {
	shape: phys.Shape;
	offset?: phys.Vec3;
	rotation?: phys.Quaternion;
};

export function addColliders(body: phys.Body, colliders: Collider[]): void {
	for (const { shape, offset, rotation } of colliders) {
		body.addShape(shape, offset, rotation);
	}
}
