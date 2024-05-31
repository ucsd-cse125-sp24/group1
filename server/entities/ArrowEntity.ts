import * as phys from "cannon-es";
import { ItemMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { Entity } from "./Entity";
import { BossEntity } from "./BossEntity";
import { MapEntity } from "./map/MapEntity";

export class ArrowEntity extends Entity {
	damage: number;

	constructor(game: Game, position: phys.Vec3, velocity: phys.Vec3, damage: number) {
		super(game, ["donut"]);
		this.body = new phys.Body({
			mass: 0.05,
			position: position,
			material: ItemMaterial,
			shape: new phys.Sphere(0.1),
		});
		this.body.applyImpulse(velocity.scale(this.body.mass));
		this.damage = damage;
	}

	onCollide(otherEntity: Entity): void {
		if (otherEntity instanceof BossEntity) {
			otherEntity.health -= this.damage;
		} else if (otherEntity instanceof MapEntity) {
			this.game.addToDeleteQueue(this.id);
		}
	}
}
