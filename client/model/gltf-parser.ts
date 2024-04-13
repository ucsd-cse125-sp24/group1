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
	}[];
};
