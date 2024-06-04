import { vec3, mat4 } from "gl-matrix";
import { ClientEntity } from "../ClientEntity";
import { ShaderProgram } from "../engine/ShaderProgram";
import { TempLightModel } from "./TempLightModel";
import { PointLight } from "./PointLight";
import { SerializedEntity } from "../../../common/messages";

export class TempLightEntity extends ClientEntity {
	#model: TempLightModel;
	light: PointLight;
	data: SerializedEntity = {
		id: `${Math.random()}`,
		position: [0, 0, 0],
		quaternion: [0, 0, 0, 0],
		model: [],
		isStatic: false,
	};

	constructor(shader: ShaderProgram, position?: vec3, color?: vec3, willMove = true) {
		const model = new TempLightModel(shader, vec3.create());
		super(shader.engine, [{ model, transform: mat4.create() }]);
		this.#model = model;
		this.light = new PointLight(shader.engine, vec3.create(), vec3.create(), willMove);
		this.data.isStatic = !willMove;
		if (position) {
			this.position = position;
		}
		if (color) {
			this.color = color;
		}
	}

	set position(position: vec3) {
		this.transform = mat4.multiply(
			mat4.create(),
			mat4.fromTranslation(mat4.create(), position),
			mat4.fromRotation(mat4.create(), Date.now() / 1000, vec3.fromValues(1, 2, 3)),
		);
		this.light.position = position;
	}

	set color(color: vec3) {
		this.#model.color = color;
		this.light.color = color;
	}
}
