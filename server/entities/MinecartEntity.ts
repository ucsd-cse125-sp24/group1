import * as phys from "cannon-es";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { GroundMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { StaticEntity } from "./StaticEntity";

const MAX_HEALTH_RING_SIZE = 25;

export class MinecartEntity extends StaticEntity {
	health = 40;
	isInvulnerableThisTick = false;

	constructor(game: Game, position: phys.Vec3) {
		super(game, position.toArray(), new phys.Box(new phys.Vec3(3, 5, 3)), GroundMaterial, [
			{ modelId: "minecart", scale: 2 },
		]);
	}

	takeDamage(damage: number): void {
		if (this.isInvulnerableThisTick) {
			return;
		}
		this.health -= damage;
		if (this.health <= 0) {
			this.health = 0;
			// Die
			this.game.addToDeleteQueue(this.id);
		}
		this.isInvulnerableThisTick = true;
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			model: [
				...this.model,
				{
					text: "HEROES' ESCAPE",
					height: 1,
					offset: [0, 10, 0],
					rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
					font: { weight: "bold" },
				},
				...Array.from({ length: this.health }, (_, i): EntityModel => {
					const ring = Math.floor(i / MAX_HEALTH_RING_SIZE);
					const angle = (i % MAX_HEALTH_RING_SIZE) / Math.min(this.health, MAX_HEALTH_RING_SIZE);
					const radius = 0.08 * (Math.min(this.health, MAX_HEALTH_RING_SIZE) - 1);
					const revolutionSpeed = Math.sin(ring * 0.9) * 0.2 + 1;
					return {
						modelId: "healthCrystal",
						scale: 0.1,
						offset: [
							Math.cos((angle + (Date.now() / radius) * 0.00005 * revolutionSpeed) * 2 * Math.PI) * radius,
							7 + Math.cos((angle + Date.now() / 20000) * 10 * Math.PI) * 0.05 + ring * 0.4,
							Math.sin((angle + (Date.now() / radius) * 0.00005 * revolutionSpeed) * 2 * Math.PI) * radius,
						],
					};
				}),
			],
			health: this.health,
		};
	}
}
