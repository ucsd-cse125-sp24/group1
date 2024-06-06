import * as phys from "cannon-es";
import { Game } from "../Game";
import { Entity } from "./Entity";

type CollisionCallback = (otherEntity: Entity) => void;

export class SolidCastEntity extends Entity {
	collisionCallback: CollisionCallback;

	constructor(
		game: Game,
		position: phys.Vec3,
		orientation: phys.Quaternion,
		shape: phys.Shape,
		onCollide: CollisionCallback,
	) {
		super(game);
		this.body = new phys.Body({
			position,
			quaternion: orientation,
			shape,
			type: phys.Body.STATIC,
		});
		this.collisionCallback = onCollide;
	}

	onCollide(otherEntity: Entity): void {
		this.collisionCallback(otherEntity);
	}
}
