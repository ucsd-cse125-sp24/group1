export type Vector2 = [x: number, y: number];
export type Vector3 = [x: number, y: number, z: number];
export type Vector4 = [r: number, g: number, b: number, a: number];
export type Quaternion = [x: number, y: number, z: number, w: number];

export type MovementInfo = {
	forward: boolean;
	backward: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
	lookDir: Vector3;
};
