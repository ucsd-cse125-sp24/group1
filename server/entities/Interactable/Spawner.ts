import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Entity } from "../Entity";
import { Game } from "../../Game";
import { InteractableEntity } from "./InteractableEntity";
import { Item, ItemType } from "./Item";
import { ModelId } from "../../../assets/models";
import { SourceTextModule } from "vm";


export class Spawner extends InteractableEntity {
	body: phys.Body;
	halfExtent: number;
	model: EntityModel[];

    toSpawn: ItemType;
    itemsSpawnedCounter: number;    

	// shape
	box: phys.Box;

	game: Game;
	previousTick: number;

	constructor(pos: Vector3, toSpawn: ItemType, model: EntityModel[] = [], game: Game) {
		super(game, model);
		this.previousTick = 0;
		this.game = game; //TEMPORARY

		this.model = model;

        this.toSpawn = toSpawn;
        this.itemsSpawnedCounter = 0;

        this.halfExtent = 0.75;

		this.body = new phys.Body({
			mass: 1000.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
			collisionFilterGroup: this.getBitFlag(),
		});

		this.box = new phys.Box(new phys.Vec3(this.halfExtent, this.halfExtent, this.halfExtent));

		this.body.addShape(this.box);
	}

	interact(player: PlayerEntity) {
		let currentTick = this.game.getCurrentTick();
		

		//have to wait 50 ticks
		if(currentTick - this.previousTick < 50){
			return;
		}

        this.itemsSpawnedCounter ++;

		let item = new Item(
			this.game,
            this.toSpawn,
            0.5,
            [this.getPos()[0] + 2, this.getPos()[1], this.getPos()[2]],
            [{modelId: this.toSpawn, offset: [0, -.5, 0]}], 
            "resource"
        );


		if (item instanceof Item) {

			item.body.position = item.body.position.vadd(new phys.Vec3(0, 1, 0));	
			item.canBeAbsorbedByCraftingTable = false;
			this.game.addToCreateQueue(item);

			this.previousTick = this.game.getCurrentTick();

		} // if there's no items in the array do nothing ig
	}
}
