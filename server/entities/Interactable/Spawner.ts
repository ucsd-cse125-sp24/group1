import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { Action, EntityModel, Use } from "../../../common/messages";
import { Entity } from "../Entity";
import { Game } from "../../Game";
import { SpawnerMaterial } from "../../materials/SourceMaterials";
import { InteractableEntity } from "./InteractableEntity";
import { Item, ItemType } from "./Item";

const TRIGGER_SPEED = 1;
const COOLDOWN_FRAMES = 15;

export class Spawner extends InteractableEntity {
	body: phys.Body;
	halfExtent: number;
	model: EntityModel[];
	isStatic = true;

	toSpawn: ItemType;

	// shape
	box: phys.Box;

	game: Game;

	previousTick: number;
	toolToHarvest: ItemType;

	constructor(game: Game, pos: Vector3, toSpawn: ItemType, toolToHarvest: ItemType, model: EntityModel[] = []) {
		super(game, model);
		this.previousTick = 0;
		this.game = game; //TEMPORARY

		this.model = model;

		this.toSpawn = toSpawn;
		this.toolToHarvest = toolToHarvest;

		this.halfExtent = 1.6;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			material: SpawnerMaterial, // depends on the item?
			collisionFilterGroup: this.getBitFlag(),
		});

		this.box = new phys.Box(new phys.Vec3(this.halfExtent, this.halfExtent, this.halfExtent));

		this.body.addShape(this.box);
	}

	onCollide(otherEntity: Entity) {
		let currentTick = this.game.getCurrentTick();

		//have to wait 50 ticks
		if (currentTick - this.previousTick < COOLDOWN_FRAMES) {
			return;
		}

		if (otherEntity.body.velocity.length() < TRIGGER_SPEED) return;

		if (otherEntity instanceof Item) {
			if (otherEntity.type != this.toolToHarvest) {
				this.game.playSound("spawnerReject", this.getPos());
				return;
			}
		} else {
			//if it's not an item, then it definitely shouldn't spawn anything
			return;
		}

		this.spawnItem();

		this.previousTick = this.game.getCurrentTick();
		console.log("sptting");
		this.game.playSound("spawnerHarvest", this.getPos());
	}

	spawnItem() {
		let item = new Item(this.game, this.toSpawn, [...this.getPos()], "resource");

		item.body.position = item.body.position.vadd(new phys.Vec3(0, 1, 0));
		item.canBeAbsorbedByCraftingTable = false;
		this.game.addToCreateQueue(item);
		item.throw(new phys.Vec3(...[10, 10, 10]));
	}

	interact(): Action<Use> | null {
		return null;
	}
}
