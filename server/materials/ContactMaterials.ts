import { ContactMaterial } from "cannon-es";
import { PlayerMaterial, GroundMaterial, SlipperyMaterial } from "./SourceMaterials";

// whenever a new CM is added, a new line needed to be added to the world initialization in TheWorld to add the contact material
export const PlayerGroundCM = new ContactMaterial(PlayerMaterial, GroundMaterial, {
	friction: 0.4,
	restitution: 0.3,
	contactEquationStiffness: 1e8,
	contactEquationRelaxation: 3,
	frictionEquationStiffness: 1e8,
});

export const PlayerPlayerCM = new ContactMaterial(PlayerMaterial, PlayerMaterial, {
	friction: 0.5,
});

export const SlipperyGroundCM = new ContactMaterial(SlipperyMaterial, GroundMaterial, {
	friction: 0.000001,
});

export const PlayerSlipperyCM = new ContactMaterial(PlayerMaterial, SlipperyMaterial, {
	friction: 0.1,
});
