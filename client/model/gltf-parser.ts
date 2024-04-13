type Gltf = {
	asset: {
		version: string;
		minVersion?: string;
		generator?: string;
		copyright?: string;
	};
	scenes: {
		nodes: number[];
	}[];
	/** Should exist; can default to 0. */
	scene?: number;
	nodes?: {
		children?: number[];
		translation?: [x: number, y: number, z: number];
		/** A quaternion */
		rotation?: [x: number, y: number, z: number, w: number];
		scale?: [x: number, y: number, z: number];
		/** Length 16 */
		matrix?: number[];
	}[];
};
