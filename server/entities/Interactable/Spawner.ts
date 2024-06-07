import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { Action, EntityModel, Use } from "../../../common/messages";
import { Entity } from "../Entity";
import { Game } from "../../Game";
import { SpawnerMaterial } from "../../materials/SourceMaterials";
import { InteractableEntity } from "./InteractableEntity";
import { Item, ItemType } from "./Item";
import { Collider, addColliders } from "../../lib/Collider";

export type SpawnerType = "wood" | "iron" | "string" | "mushroom";

let fullSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI);
let halfSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI / 2);
const modelForSpawnerType: Record<SpawnerType, EntityModel[]> = {
	wood: [{ modelId: "chair", offset: [0, -1.5, 0] }],
	iron: [{ modelId: "ore_vein", offset: [0, -1.75, 0] }],
	string: [{ modelId: "spider_web", offset: [0, -1.5, 0] }],
	mushroom: [{ modelId: "mushroom_cluster", offset: [0, -0.1, 0] }],
};
const colliderShapeForSpawnerType: Record<SpawnerType, Collider[]> = {
	string: [
		{
			shape: new phys.Box(new phys.Vec3(0.2, 2.2, 2)),
			rotation: new phys.Quaternion()
				.setFromAxisAngle(phys.Vec3.UNIT_Y, Math.PI / 4)
				.mult(new phys.Quaternion().setFromAxisAngle(phys.Vec3.UNIT_Z, (Math.PI / 4) * 0.75)),
		},
	],
	iron: [{ shape: new phys.Box(new phys.Vec3(1.7, 1.55, 1.7)) }],
	mushroom: [
		{ shape: new phys.Box(new phys.Vec3(1.6, 0.2, 1.6)) },
		{ shape: new phys.Cylinder(0.5, 0.5, 1.4, 5), offset: new phys.Vec3(-0.35, 0.9, 0.35) },
		{ shape: new phys.Cylinder(0.35, 0.35, 0.9, 5), offset: new phys.Vec3(0.4, 0.5, -0.5) },
	],
	wood: [{ shape: new phys.Box(new phys.Vec3(1.6, 1.6, 1.6)) }],
};

const TRIGGER_SPEED = 1;
const COOLDOWN_FRAMES = 15;

export class Spawner extends InteractableEntity {
	body: phys.Body;
	isStatic = true;

	toSpawn: ItemType;

	previousTick: number;
	toolToHarvest: ItemType;

	constructor(game: Game, pos: Vector3, spawnerType: SpawnerType, toSpawn: ItemType, toolToHarvest: ItemType) {
		super(game, modelForSpawnerType[spawnerType]);
		this.previousTick = 0;

		this.toSpawn = toSpawn;
		this.toolToHarvest = toolToHarvest;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			material: SpawnerMaterial, // depends on the item?
			collisionFilterGroup: this.getBitFlag(),
		});

		addColliders(this.body, colliderShapeForSpawnerType[spawnerType]);
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
	}

	spawnItem() {
		let item = new Item(this.game, this.toSpawn, [...this.getPos()], "resource");

		item.body.position = item.body.position.vadd(new phys.Vec3(0, 1, 0));
		item.canBeAbsorbedByCraftingTable = false;
		this.game.addToCreateQueue(item);
		item.throw(new phys.Vec3(...[10, 10, 10]));

		this.previousTick = this.game.getCurrentTick();
		console.log("sptting");
		this.game.playSound("spawnerHarvest", this.getPos());
	}

	interact(): Action<Use> | null {
		return null;
	}
}
