import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { TheWorld } from "../physics";

export interface Entity {
	
	name: string;
	type: string;
	body: phys.Body;
	model: number;

	getPos: () => phys.Vec3;
	getRot: () => phys.Quaternion;
}



/**
 * TO MAKE:
 * PLAYER ENTITY
 *     HERO ENTITY
 *     BOSS ENTITY
 * ITEM ENTITY
 *     RESOURCE ENTITY
 *     TOOL ENTITY
 * MAP ENTITY
 * DOOR ENTITY
 *
 */
