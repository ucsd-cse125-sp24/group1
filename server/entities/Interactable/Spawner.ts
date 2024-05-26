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

	// shape
	box: phys.Box;

	game: Game;

	previousTick: number;
	toolToHarvest: string;

	constructor(game: Game, pos: Vector3, toSpawn: ItemType, toolToHarvest: string, model: EntityModel[] = []) {
		super(game, model);
		this.previousTick = 0;
		this.game = game; //TEMPORARY

		this.model = model;

        this.toSpawn = toSpawn;
		this.toolToHarvest = toolToHarvest;

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

	onCollide(otherEntity: Entity) {

		let currentTick = this.game.getCurrentTick();

		//have to wait 50 ticks
		if(currentTick - this.previousTick < 50){
			return;
		}


		if(otherEntity instanceof Item){
			if(otherEntity.type != this.toolToHarvest) {
				return;
			}
		}
		

		let item = new Item(
			this.game,
            this.toSpawn,
            0.5,
            [...this.getPos()],
            [{modelId: this.toSpawn, offset: [0, -.5, 0]}], 
            "resource"
        );


		if (item instanceof Item) {

			item.body.position = item.body.position.vadd(new phys.Vec3(0, 1, 0));	
			item.canBeAbsorbedByCraftingTable = false;
			this.game.addToCreateQueue(item);
			item.throw(new phys.Vec3(...[0, 100, 0]));
			this.previousTick = this.game.getCurrentTick();
			console.log("sptting");
		} // if there's no items in the array do nothing ig
	}

	interact() {
		
	}
}