import * as phys from "cannon-es";
import { GroundMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { StaticEntity } from "./StaticEntity";

export class MinecartEntity extends StaticEntity {
	health = 100;

	constructor(game: Game, position: phys.Vec3) {
		super(game, position.toArray(), new phys.Box(new phys.Vec3(3, 3, 3)), GroundMaterial, [
			{ modelId: "minecart", scale: 2 },
		]);
	}

	takeDamage(damage: number): void {
		this.health -= damage;
		if (this.health <= 0) {
			this.health = 0;
			// Die
			this.game.addToDeleteQueue(this.id);
		}
	}
}