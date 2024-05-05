import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../../common/commontypes";
import type { ModelId } from "../../../common/models";
import { SerializedEntity } from "../../../common/messages";
import { InteractableEntity } from "./InteractableEntity";
import { PlayerEntity } from "../PlayerEntity";
import { HeroEntity } from "../HeroEntity";

export class CraftingTable extends InteractableEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];
    radius: number;
	
	// shape
	sphere: phys.Sphere;

	constructor(name: string, pos: Vector3, model: ModelId[] = []) {
		super(name, model);

		this.type = "crafting-table";
		this.name = name;
		this.model = model;

        //this can be workable
        this.radius = 0.5;


		this.body = new phys.Body({
			mass: 1.0, 
			position: new phys.Vec3(...pos),
			//material: depends on the item,
		});

		this.sphere = new phys.Sphere(this.radius);
		
		this.body.addShape(this.sphere);
	}

    interact(player: PlayerEntity) {
        
    }
	

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "sphere", //capsule Bot
					radius: this.sphere.radius,
					offset: [0, 0, 0],
				},
			],
		};
	}
}
