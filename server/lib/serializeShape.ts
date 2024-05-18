import { Box, Cylinder, Plane, Shape, Sphere } from "cannon-es";
import { SerializedColliderBase } from "../../common/messages";

export function serializeShape(shape: Shape): SerializedColliderBase {
	if (shape instanceof Box) {
		return {
			type: "box",
			size: shape.halfExtents.toArray(),
		};
	}
	if (shape instanceof Plane) {
		return {
			type: "plane",
		};
	}
	if (shape instanceof Sphere) {
		return {
			type: "sphere",
			radius: shape.radius,
		};
	}
	if (shape instanceof Cylinder) {
		return {
			type: "cylinder",
			radiusTop: shape.radiusTop,
			radiusBottom: shape.radiusBottom,
			height: shape.height,
			numSegments: shape.numSegments,
		};
	}
	throw new TypeError(`Unsupported collider shape ${shape.constructor.name}`);
}
